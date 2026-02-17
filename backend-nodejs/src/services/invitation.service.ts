import * as invitationModel from "../models/invitation.model";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import * as userModel from "../models/user.model";
import {
  CreateInvitationDTO,
  InvitationDTO,
  InvitationResponseDTO,
  InvitationDetailsDTO,
} from "../dtos/invitation.dto";
import { AccessRole } from "../dtos/caregiver-access.dto";
import { isExpired } from "../utils/token.util";

/**
 * Create a new invitation
 */
export async function createInvitation(
  babyId: number,
  inviterUserId: number,
  data: CreateInvitationDTO
): Promise<InvitationResponseDTO> {
  // Check if user already has access to this baby
  const existingAccess = await caregiverAccessModel.getUserBabyAccess(
    0, // We need to find user by email first
    babyId
  );

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
    invited_role: invitation.invited_role,
    expires_at: invitation.expires_at,
    is_expired: isExpired(invitation.expires_at),
  };
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  token: string,
  userId: number,
  userEmail: string
): Promise<{ success: boolean; message: string; baby_id?: number }> {
  const invitation = await invitationModel.findInvitationByToken(token);

  if (!invitation) {
    return { success: false, message: "Invitation not found" };
  }

  // Check if already accepted
  if (invitation.accepted_at) {
    return { success: false, message: "Invitation has already been accepted" };
  }

  // Check if expired
  if (isExpired(invitation.expires_at)) {
    return { success: false, message: "Invitation has expired" };
  }

  // Optionally verify email matches (can be relaxed based on requirements)
  if (invitation.invited_email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      success: false,
      message: "This invitation was sent to a different email address",
    };
  }

  // Check if user already has access
  const existingAccess = await caregiverAccessModel.getUserBabyAccess(
    userId,
    invitation.baby_id
  );

  if (existingAccess) {
    return { success: false, message: "You already have access to this baby" };
  }

  // Determine permissions based on role
  const permissions = getRolePermissions(invitation.invited_role as AccessRole);

  // Create caregiver access
  await caregiverAccessModel.createCaregiverAccess({
    baby_id: invitation.baby_id,
    user_id: userId,
    access_role: invitation.invited_role as AccessRole,
    ...permissions,
    invited_at: invitation.created_at,
  });

  // Mark invitation as accepted
  await invitationModel.acceptInvitation(invitation.invite_id, userId);

  return {
    success: true,
    message: "Invitation accepted successfully",
    baby_id: invitation.baby_id,
  };
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(
  inviteId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  const invitation = await invitationModel.findInvitationById(inviteId);

  if (!invitation) {
    return { success: false, message: "Invitation not found" };
  }

  // Only the inviter can cancel
  if (invitation.inviter_user_id !== userId) {
    return { success: false, message: "Only the inviter can cancel this invitation" };
  }

  // Cannot cancel accepted invitations
  if (invitation.accepted_at) {
    return { success: false, message: "Cannot cancel an accepted invitation" };
  }

  await invitationModel.deleteInvitation(inviteId);

  return { success: true, message: "Invitation cancelled successfully" };
}

/**
 * Format invitation for API response
 */
function formatInvitationResponse(invitation: InvitationDTO): InvitationResponseDTO {
  return {
    invite_id: invitation.invite_id,
    baby_id: invitation.baby_id,
    invited_email: invitation.invited_email,
    invited_role: invitation.invited_role,
    token: invitation.token,
    expires_at: invitation.expires_at,
    is_expired: isExpired(invitation.expires_at),
    is_accepted: invitation.accepted_at !== null,
    accepted_at: invitation.accepted_at,
  };
}

/**
 * Get default permissions for a role
 */
function getRolePermissions(role: AccessRole): {
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
} {
  switch (role) {
    case AccessRole.SECONDARY_CAREGIVER:
      return {
        can_edit_health: true,
        can_edit_activities: true,
        can_share: false,
      };
    case AccessRole.PROFESSIONAL:
      return {
        can_edit_health: true,
        can_edit_activities: false,
        can_share: false,
      };
    default:
      return {
        can_edit_health: false,
        can_edit_activities: false,
        can_share: false,
      };
  }
}
