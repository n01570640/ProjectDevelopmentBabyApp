import { getDb } from "../db";
import sql from "mssql";
import {
  CaregiverAccessDTO,
  CaregiverWithUserDTO,
  CreateCaregiverAccessDTO,
  ROLE_PRIMARY,
  Permission,
} from "../dtos/caregiver-access.dto";

/**
 * Get user's access to a specific baby
 */
export async function getUserBabyAccess(
  userId: number,
  babyId: number
): Promise<CaregiverAccessDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT ca.baby_id, ca.user_id, ca.access_role,
             r.role_name,
             ca.can_edit_health, ca.can_edit_activities, ca.can_share,
             ca.invited_at, ca.accepted_at
      FROM caregiver_baby_access ca
      JOIN roles r ON ca.access_role = r.role_id
      WHERE ca.user_id = @user_id AND ca.baby_id = @baby_id
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  const record = result.recordset[0];
  return {
    baby_id: record.baby_id,
    user_id: record.user_id,
    access_role: record.access_role,
    role_name: record.role_name,
    can_edit_health: record.can_edit_health,
    can_edit_activities: record.can_edit_activities,
    can_share: record.can_share,
    invited_at: record.invited_at,
    accepted_at: record.accepted_at,
  };
}

/**
 * Check if user has a specific permission for a baby
 */
export async function checkPermission(
  userId: number,
  babyId: number,
  permission: Permission
): Promise<boolean> {
  const access = await getUserBabyAccess(userId, babyId);

  if (!access) {
    return false;
  }

  return access[permission] === true;
}

/**
 * Check if user is PRIMARY_CAREGIVER for a baby
 */
export async function isPrimaryCaregiver(
  userId: number,
  babyId: number
): Promise<boolean> {
  const access = await getUserBabyAccess(userId, babyId);

  if (!access) {
    return false;
  }

  return access.access_role === ROLE_PRIMARY;
}

/**
 * Get all babies a user has access to
 */
export async function getUserBabies(userId: number): Promise<number[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT baby_id
      FROM caregiver_baby_access
      WHERE user_id = @user_id
    `);

  return result.recordset.map((row) => row.baby_id);
}

/**
 * Get all caregivers for a baby
 */
export async function getBabyCaregivers(
  babyId: number
): Promise<CaregiverAccessDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT ca.baby_id, ca.user_id, ca.access_role,
             r.role_name,
             ca.can_edit_health, ca.can_edit_activities, ca.can_share,
             ca.invited_at, ca.accepted_at
      FROM caregiver_baby_access ca
      JOIN roles r ON ca.access_role = r.role_id
      WHERE ca.baby_id = @baby_id
    `);

  return result.recordset.map((record) => ({
    baby_id: record.baby_id,
    user_id: record.user_id,
    access_role: record.access_role,
    role_name: record.role_name,
    can_edit_health: record.can_edit_health,
    can_edit_activities: record.can_edit_activities,
    can_share: record.can_share,
    invited_at: record.invited_at,
    accepted_at: record.accepted_at,
  }));
}

/**
 * Get all caregivers for a baby with user details (name, email)
 */
export async function getBabyCaregiversWithUserInfo(
  babyId: number
): Promise<CaregiverWithUserDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT ca.baby_id, ca.user_id, ca.access_role,
             r.role_name,
             ca.can_edit_health, ca.can_edit_activities, ca.can_share,
             u.full_name, u.email
      FROM caregiver_baby_access ca
      JOIN roles r ON ca.access_role = r.role_id
      JOIN users u ON ca.user_id = u.user_id
      WHERE ca.baby_id = @baby_id
    `);

  return result.recordset.map((record) => ({
    baby_id: record.baby_id,
    user_id: record.user_id,
    access_role: record.access_role,
    role_name: record.role_name,
    can_edit_health: record.can_edit_health,
    can_edit_activities: record.can_edit_activities,
    can_share: record.can_share,
    full_name: record.full_name,
    email: record.email,
  }));
}

/**
 * Create caregiver access record
 */
export async function createCaregiverAccess(
  data: CreateCaregiverAccessDTO,
  transactionRequest?: sql.Request
): Promise<CaregiverAccessDTO> {
  const request = transactionRequest
    ? transactionRequest
    : (await getDb()).request();

  request
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("user_id", sql.BigInt, data.user_id)
    .input("access_role", sql.Int, data.access_role)
    .input("can_edit_health", sql.Bit, data.can_edit_health)
    .input("can_edit_activities", sql.Bit, data.can_edit_activities)
    .input("can_share", sql.Bit, data.can_share);

  if (data.invited_at) {
    request.input("invited_at", sql.DateTime2, data.invited_at);
  }

  const result = await request.query(`
      INSERT INTO caregiver_baby_access
        (baby_id, user_id, access_role, can_edit_health, can_edit_activities, can_share, invited_at, accepted_at)
      OUTPUT INSERTED.*
      VALUES (@baby_id, @user_id, @access_role, @can_edit_health, @can_edit_activities, @can_share, ${data.invited_at ? "@invited_at" : "SYSDATETIME()"}, SYSDATETIME())
    `);

  const record = result.recordset[0];
  return {
    baby_id: record.baby_id,
    user_id: record.user_id,
    access_role: record.access_role,
    role_name: "", // Intentionally empty: this runs inside a transaction so we cannot JOIN roles. Callers (baby creation, invite acceptance) don't display role_name from this return value.
    can_edit_health: record.can_edit_health,
    can_edit_activities: record.can_edit_activities,
    can_share: record.can_share,
    invited_at: record.invited_at,
    accepted_at: record.accepted_at,
  };
}

/**
 * Update caregiver access permissions
 */
export async function updateCaregiverAccess(
  userId: number,
  babyId: number,
  updates: Partial<{
    access_role: number;
    can_edit_health: boolean;
    can_edit_activities: boolean;
    can_share: boolean;
  }>
): Promise<CaregiverAccessDTO | null> {
  const db = await getDb();

  // Build dynamic update query
  const setClauses: string[] = [];
  const request = db.request();
  request.input("user_id", sql.BigInt, userId);
  request.input("baby_id", sql.BigInt, babyId);

  if (updates.access_role !== undefined) {
    setClauses.push("access_role = @access_role");
    request.input("access_role", sql.Int, updates.access_role);
  }
  if (updates.can_edit_health !== undefined) {
    setClauses.push("can_edit_health = @can_edit_health");
    request.input("can_edit_health", sql.Bit, updates.can_edit_health);
  }
  if (updates.can_edit_activities !== undefined) {
    setClauses.push("can_edit_activities = @can_edit_activities");
    request.input("can_edit_activities", sql.Bit, updates.can_edit_activities);
  }
  if (updates.can_share !== undefined) {
    setClauses.push("can_share = @can_share");
    request.input("can_share", sql.Bit, updates.can_share);
  }

  if (setClauses.length === 0) {
    return getUserBabyAccess(userId, babyId);
  }

  const result = await request.query(`
    UPDATE caregiver_baby_access
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE user_id = @user_id AND baby_id = @baby_id
  `);

  if (result.recordset.length === 0) {
    return null;
  }

  // Re-fetch to get role_name via JOIN
  return getUserBabyAccess(userId, babyId);
}

/**
 * Remove caregiver access
 */
export async function removeCaregiverAccess(
  userId: number,
  babyId: number
): Promise<boolean> {
  const db = await getDb();

  // Guard: prevent removing the sole PRIMARY_CAREGIVER
  const access = await getUserBabyAccess(userId, babyId);
  if (access?.access_role === ROLE_PRIMARY) {
    const countResult = await db
      .request()
      .input("baby_id", sql.BigInt, babyId)
      .input("role_primary", sql.Int, ROLE_PRIMARY)
      .query(`
        SELECT COUNT(*) as count
        FROM caregiver_baby_access
        WHERE baby_id = @baby_id AND access_role = @role_primary
      `);

    if (countResult.recordset[0].count <= 1) {
      throw new Error("Cannot remove the sole primary caregiver");
    }
  }

  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      DELETE FROM caregiver_baby_access
      WHERE user_id = @user_id AND baby_id = @baby_id
    `);

  return result.rowsAffected[0] > 0;
}
