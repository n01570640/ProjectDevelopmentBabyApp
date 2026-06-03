import * as invitationModel from "../models/invitation.model";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import * as userModel from "../models/user.model";
import {
  CreateInvitationDTO,
  InvitationDTO,
  InvitationResponseDTO,
  InvitationDetailsDTO,
} from "../dtos/invitation.dto";
import { isExpired } from "../utils/token.util";
import { getRolePermissions } from "../utils/role-permissions.util";
import sql from "mssql";
import { getDb } from "../db";

/**
 * Create a new invitation
 */
export async function createInvitation(
  babyId: number,
  inviterUserId: number,
  data: CreateInvitationDTO
): Promise<InvitationResponseDTO> {
  // Check if there's already a pending invitation
  const hasPending = await invitationModel.hasPendingInvitation(
    babyId,
    data.invited_email
  );

  if (hasPending) {
    throw new Error("There is already a pending invitation for this email");
  }

  // Check if the invited user already exists and has access
  const existingUser = await userModel.findUserByEmail(data.invited_email);
  if (existingUser) {
    const userAccess = await caregiverAccessModel.getUserBabyAccess(
      existingUser.user_id,
      babyId
    );
    if (userAccess) {
      throw new Error("This user already has access to this baby");
    }
  }

  const invitation = await invitationModel.createInvitation({
    baby_id: babyId,
    invited_email: data.invited_email,
    invited_role: data.invited_role,
    inviter_user_id: inviterUserId,
  });

  return formatInvitationResponse(invitation);
}

/**
 * Get pending invitations for a baby
 */
export async function getPendingInvitations(
  babyId: number
): Promise<InvitationResponseDTO[]> {
  const invitations = await invitationModel.getPendingInvitations(babyId);
  return invitations.map(formatInvitationResponse);
}

/**
 * Get invitation details by token (for accepting)
 */
export async function getInvitationByToken(
  token: string
): Promise<InvitationDetailsDTO | null> {
  const invitation = await invitationModel.findInvitationByToken(token);

  if (!invitation) {
    return null;
  }

  return {
    baby_name: invitation.baby_name || "Unknown",
    inviter_name: invitation.inviter_name || "Unknown",
    invited_email: invitation.invited_email,
    invited_role: invitation.invited_role_name ?? "",
    expires_at: invitation.expires_at,
    is_expired: isExpired(invitation.expires_at),
  };
}

/**
 * Accept an invitation (API flow — authenticated user accepting via token)
 * Throws on validation failures; returns baby_id on success.
 */
export async function acceptInvitation(
  token: string,
  userId: number,
  userEmail: string
): Promise<{ baby_id: number }> {
  const invitation = await invitationModel.findInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.accepted_at) {
    throw new Error("Invitation has already been accepted");
  }

  if (isExpired(invitation.expires_at)) {
    throw new Error("Invitation has expired");
  }

  if (invitation.invited_email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address");
  }

  const existingAccess = await caregiverAccessModel.getUserBabyAccess(
    userId,
    invitation.baby_id
  );

  if (existingAccess) {
    throw new Error("You already have access to this baby");
  }

  const permissions = getRolePermissions(invitation.invited_role);

  const db = await getDb();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    await caregiverAccessModel.createCaregiverAccess(
      {
        baby_id: invitation.baby_id,
        user_id: userId,
        access_role: invitation.invited_role,
        ...permissions,
        invited_at: invitation.created_at,
      },
      new sql.Request(transaction)
    );

    await invitationModel.acceptInvitation(
      invitation.invite_id,
      userId,
      new sql.Request(transaction)
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return { baby_id: invitation.baby_id };
}

/**
 * Cancel an invitation
 * Throws on validation failures; returns void on success.
 */
export async function cancelInvitation(
  inviteId: number,
  userId: number,
  babyId: number
): Promise<void> {
  const invitation = await invitationModel.findInvitationById(inviteId);

  // Debug log — remove after confirming fix
  console.log("cancelInvitation debug:", {
    inviteId, babyId, userId,
    found: !!invitation,
    dbBabyId: invitation?.baby_id, dbBabyIdType: typeof invitation?.baby_id,
    dbInviterId: invitation?.inviter_user_id, dbInviterType: typeof invitation?.inviter_user_id,
  });

  if (!invitation || Number(invitation.baby_id) !== Number(babyId)) {
    throw new Error("Invitation not found");
  }

  if (Number(invitation.inviter_user_id) !== Number(userId)) {
    throw new Error("Only the inviter can cancel this invitation");
  }

  if (invitation.accepted_at) {
    throw new Error("Cannot cancel an accepted invitation");
  }

  await invitationModel.deleteInvitation(inviteId);
}

/**
 * Accept an invitation by token during registration flow.
 * Throws on validation failures (not found, expired, email mismatch).
 */
export async function acceptInvitationByToken(
  userId: number,
  email: string,
  invitationToken: string,
  transaction?: sql.Transaction
): Promise<void> {
  const invite = await invitationModel.findInvitationByToken(invitationToken);

  if (!invite) {
    throw new Error("Invitation token not found");
  }

  if (invite.accepted_at) {
    throw new Error("Invitation has already been accepted");
  }

  if (isExpired(invite.expires_at)) {
    throw new Error("Invitation has expired");
  }

  if (invite.invited_email.toLowerCase() !== email.toLowerCase()) {
    throw new Error("Registration email does not match invitation email");
  }

  const permissions = getRolePermissions(invite.invited_role);

  await caregiverAccessModel.createCaregiverAccess(
    {
      baby_id: invite.baby_id,
      user_id: userId,
      access_role: invite.invited_role,
      ...permissions,
      invited_at: invite.created_at,
    },
    transaction ? new sql.Request(transaction) : undefined
  );

  await invitationModel.acceptInvitation(
    invite.invite_id,
    userId,
    transaction ? new sql.Request(transaction) : undefined
  );
}

/**
 * Format invitation for API response
 */
function formatInvitationResponse(invitation: InvitationDTO): InvitationResponseDTO {
  return {
    invite_id: invitation.invite_id,
    baby_id: invitation.baby_id,
    invited_email: invitation.invited_email,
    invited_role: invitation.invited_role_name ?? "",
    token: invitation.token,
    expires_at: invitation.expires_at,
    is_expired: isExpired(invitation.expires_at),
    is_accepted: invitation.accepted_at !== null,
    accepted_at: invitation.accepted_at,
  };
}

