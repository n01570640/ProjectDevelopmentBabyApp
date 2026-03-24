import { getDb } from "../db";
import sql from "mssql";
import { InvitationDTO } from "../dtos/invitation.dto";
import { generateSecureToken, generateExpirationDate } from "../utils/token.util";

/**
 * Create a new invitation
 */
export async function createInvitation(data: {
  baby_id: number;
  invited_email: string;
  invited_role: number;
  inviter_user_id: number;
  expires_in_days?: number;
}): Promise<InvitationDTO> {
  const db = await getDb();
  const token = generateSecureToken();
  const expires_at = generateExpirationDate(data.expires_in_days || 7);

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("invited_email", sql.NVarChar(255), data.invited_email.toLowerCase())
    .input("invited_role", sql.Int, data.invited_role)
    .input("inviter_user_id", sql.BigInt, data.inviter_user_id)
    .input("token", sql.UniqueIdentifier, token)
    .input("expires_at", sql.DateTime2, expires_at)
    .query(`
      INSERT INTO share_invites
        (baby_id, invited_email, invited_role, inviter_user_id, token, expires_at)
      OUTPUT INSERTED.*
      VALUES (@baby_id, @invited_email, @invited_role, @inviter_user_id, @token, @expires_at)
    `);

  return result.recordset[0] as InvitationDTO;
}

/**
 * Find invitation by ID
 */
export async function findInvitationById(
  invite_id: number
): Promise<InvitationDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("invite_id", sql.BigInt, invite_id)
    .query(`
      SELECT si.*, b.display_name as baby_name, u.full_name as inviter_name, r.role_name as invited_role_name
      FROM share_invites si
      LEFT JOIN babies b ON si.baby_id = b.baby_id
      LEFT JOIN users u ON si.inviter_user_id = u.user_id
      LEFT JOIN roles r ON si.invited_role = r.role_id
      WHERE si.invite_id = @invite_id
    `);

  return result.recordset[0] || null;
}

/**
 * Find invitation by token
 */
export async function findInvitationByToken(
  token: string
): Promise<InvitationDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("token", sql.UniqueIdentifier, token)
    .query(`
      SELECT si.*, b.display_name as baby_name, u.full_name as inviter_name, r.role_name as invited_role_name
      FROM share_invites si
      LEFT JOIN babies b ON si.baby_id = b.baby_id
      LEFT JOIN users u ON si.inviter_user_id = u.user_id
      LEFT JOIN roles r ON si.invited_role = r.role_id
      WHERE si.token = @token
    `);

  return result.recordset[0] || null;
}

/**
 * Get pending invitations for a baby
 */
export async function getPendingInvitations(
  baby_id: number
): Promise<InvitationDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, baby_id)
    .query(`
      SELECT si.*, u.full_name as inviter_name, r.role_name as invited_role_name
      FROM share_invites si
      LEFT JOIN users u ON si.inviter_user_id = u.user_id
      LEFT JOIN roles r ON si.invited_role = r.role_id
      WHERE si.baby_id = @baby_id
        AND si.accepted_at IS NULL
        AND si.expires_at > SYSDATETIME()
      ORDER BY si.expires_at ASC
    `);

  return result.recordset as InvitationDTO[];
}

/**
 * Get all invitations for a baby (including expired/accepted)
 */
export async function getAllInvitations(
  baby_id: number
): Promise<InvitationDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, baby_id)
    .query(`
      SELECT si.*, u.full_name as inviter_name, r.role_name as invited_role_name
      FROM share_invites si
      LEFT JOIN users u ON si.inviter_user_id = u.user_id
      LEFT JOIN roles r ON si.invited_role = r.role_id
      WHERE si.baby_id = @baby_id
      ORDER BY si.expires_at DESC
    `);

  return result.recordset as InvitationDTO[];
}

/**
 * Get all pending invitations for an email address
 */
export async function getPendingInvitationsByEmail(
  email: string
): Promise<InvitationDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("email", sql.NVarChar(255), email.toLowerCase())
    .query(`
      SELECT *
      FROM share_invites
      WHERE invited_email = @email
        AND accepted_at IS NULL
        AND expires_at > SYSDATETIME()
    `);

  return result.recordset as InvitationDTO[];
}

/**
 * Check if there's already a pending invitation for this email and baby
 */
export async function hasPendingInvitation(
  baby_id: number,
  email: string
): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, baby_id)
    .input("email", sql.NVarChar(255), email.toLowerCase())
    .query(`
      SELECT COUNT(*) as count
      FROM share_invites
      WHERE baby_id = @baby_id
        AND invited_email = @email
        AND accepted_at IS NULL
        AND expires_at > SYSDATETIME()
    `);

  return result.recordset[0].count > 0;
}

/**
 * Mark invitation as accepted
 */
export async function acceptInvitation(
  invite_id: number,
  user_id: number,
  transactionRequest?: sql.Request
): Promise<InvitationDTO | null> {
  const request = transactionRequest
    ? transactionRequest
    : (await getDb()).request();

  const result = await request
    .input("invite_id", sql.BigInt, invite_id)
    .input("user_id", sql.BigInt, user_id)
    .query(`
      UPDATE share_invites
      SET accepted_user_id = @user_id, accepted_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE invite_id = @invite_id
        AND accepted_at IS NULL
        AND expires_at > SYSDATETIME()
    `);

  return result.recordset[0] || null;
}

/**
 * Delete invitation (cancel)
 */
export async function deleteInvitation(invite_id: number): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("invite_id", sql.BigInt, invite_id)
    .query(`DELETE FROM share_invites WHERE invite_id = @invite_id`);

  return result.rowsAffected[0] > 0;
}
