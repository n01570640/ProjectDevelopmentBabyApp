import { getDb } from "../db";
import sql from "mssql";
import { BabyDTO, CreateBabyDTO, UpdateBabyDTO, BabyWithAccessDTO, BabyWithDetailsDTO } from "../dtos/baby.dto";
import { ROLE_PRIMARY } from "../dtos/caregiver-access.dto";

/**
 * Create a new baby
 */
export async function createBaby(
  data: CreateBabyDTO,
  transactionRequest?: sql.Request
): Promise<BabyDTO> {
  const request = transactionRequest
    ? transactionRequest
    : (await getDb()).request();

  const result = await request
    .input("display_name", sql.NVarChar(200), data.display_name)
    .input("date_of_birth", sql.Date, data.date_of_birth)
    .input("sex", sql.VarChar(10), data.sex ?? null)
    .input("blood_type", sql.VarChar(3), data.blood_type ?? null)
    .input("notes", sql.NVarChar, data.notes ?? null)
    .query(`
      INSERT INTO babies (display_name, date_of_birth, sex, blood_type, notes, created_at)
      OUTPUT INSERTED.*
      VALUES (@display_name, @date_of_birth, @sex, @blood_type, @notes, SYSDATETIME())
    `);

  return result.recordset[0] as BabyDTO;
}

/**
 * Find baby by ID
 */
export async function findBabyById(baby_id: number): Promise<BabyDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, baby_id)
    .query(`SELECT * FROM babies WHERE baby_id = @baby_id`);

  return result.recordset[0] || null;
}

/**
 * Get all babies accessible by a user (with access info)
 */
export async function findBabiesByUserId(
  userId: number
): Promise<BabyWithAccessDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`
      SELECT
        b.baby_id, b.display_name, b.date_of_birth, b.sex, b.blood_type, b.notes, b.created_at,
        r.role_name AS access_role, cba.can_edit_health, cba.can_edit_activities, cba.can_share
      FROM babies b
      INNER JOIN caregiver_baby_access cba ON b.baby_id = cba.baby_id
      INNER JOIN roles r ON cba.access_role = r.role_id
      WHERE cba.user_id = @user_id
      ORDER BY b.created_at DESC
    `);

  return result.recordset as BabyWithAccessDTO[];
}

/**
 * Update baby
 */
export async function updateBaby(
  baby_id: number,
  data: UpdateBabyDTO
): Promise<BabyDTO | null> {
  const db = await getDb();

  // Build dynamic update query
  const setClauses: string[] = [];
  const request = db.request();
  request.input("baby_id", sql.BigInt, baby_id);

  if (data.display_name !== undefined) {
    setClauses.push("display_name = @display_name");
    request.input("display_name", sql.NVarChar(200), data.display_name);
  }
  if (data.date_of_birth !== undefined) {
    setClauses.push("date_of_birth = @date_of_birth");
    request.input("date_of_birth", sql.Date, data.date_of_birth);
  }
  if (data.sex !== undefined) {
    setClauses.push("sex = @sex");
    request.input("sex", sql.VarChar(10), data.sex);
  }
  if (data.blood_type !== undefined) {
    setClauses.push("blood_type = @blood_type");
    request.input("blood_type", sql.VarChar(3), data.blood_type);
  }
  if (data.notes !== undefined) {
    setClauses.push("notes = @notes");
    request.input("notes", sql.NVarChar, data.notes);
  }

  if (setClauses.length === 0) {
    return findBabyById(baby_id);
  }

  const result = await request.query(`
    UPDATE babies
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE baby_id = @baby_id
  `);

  return result.recordset[0] || null;
}

/**
 * Delete baby and all related records (wrapped in a transaction)
 */
export async function deleteBaby(baby_id: number): Promise<boolean> {
  const db = await getDb();
  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input("baby_id", sql.BigInt, baby_id)
      .query(`DELETE FROM share_invites WHERE baby_id = @baby_id`);

    await new sql.Request(transaction)
      .input("baby_id", sql.BigInt, baby_id)
      .query(`DELETE FROM baby_vaccinations WHERE baby_id = @baby_id`);

    await new sql.Request(transaction)
      .input("baby_id", sql.BigInt, baby_id)
      .query(`DELETE FROM growth_metrics WHERE baby_id = @baby_id`);

    await new sql.Request(transaction)
      .input("baby_id", sql.BigInt, baby_id)
      .query(`DELETE FROM caregiver_baby_access WHERE baby_id = @baby_id`);

    const result = await new sql.Request(transaction)
      .input("baby_id", sql.BigInt, baby_id)
      .query(`DELETE FROM babies WHERE baby_id = @baby_id`);

    await transaction.commit();
    return result.rowsAffected[0] > 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Get all babies accessible by a user with full details (including latest growth and primary caregiver)
 */
export async function findBabiesWithDetailsByUserId(
  userId: number
): Promise<BabyWithDetailsDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .input("role_primary", sql.Int, ROLE_PRIMARY)
    .query(`
      SELECT
        b.baby_id, b.display_name, b.date_of_birth, b.sex, b.blood_type, b.notes, b.created_at,
        r.role_name AS access_role, cba.can_edit_health, cba.can_edit_activities, cba.can_share,
        lg.weight_kg AS latest_weight_kg,
        lg.length_cm AS latest_length_cm,
        lg.head_circum_cm AS latest_head_circum_cm,
        lg.recorded_at AS latest_growth_recorded_at,
        pc.full_name AS primary_caregiver_name
      FROM babies b
      INNER JOIN caregiver_baby_access cba ON b.baby_id = cba.baby_id
      INNER JOIN roles r ON cba.access_role = r.role_id
      -- Latest growth metrics (subquery to get most recent record per baby)
      LEFT JOIN (
        SELECT gm.baby_id, gm.weight_kg, gm.length_cm, gm.head_circum_cm, gm.recorded_at
        FROM growth_metrics gm
        INNER JOIN (
          SELECT baby_id, MAX(recorded_at) AS max_recorded_at
          FROM growth_metrics
          GROUP BY baby_id
        ) latest ON gm.baby_id = latest.baby_id AND gm.recorded_at = latest.max_recorded_at
      ) lg ON b.baby_id = lg.baby_id
      -- Primary caregiver name
      LEFT JOIN caregiver_baby_access pc_access
        ON b.baby_id = pc_access.baby_id AND pc_access.access_role = @role_primary
      LEFT JOIN users pc ON pc_access.user_id = pc.user_id
      WHERE cba.user_id = @user_id
      ORDER BY b.created_at DESC
    `);

  // Transform the flat result into the nested DTO structure
  return result.recordset.map((row: any) => ({
    baby_id: row.baby_id,
    display_name: row.display_name,
    date_of_birth: row.date_of_birth,
    sex: row.sex,
    blood_type: row.blood_type,
    notes: row.notes,
    created_at: row.created_at,
    access_role: row.access_role,
    can_edit_health: row.can_edit_health,
    can_edit_activities: row.can_edit_activities,
    can_share: row.can_share,
    latest_growth: row.latest_growth_recorded_at ? {
      weight_kg: row.latest_weight_kg,
      length_cm: row.latest_length_cm,
      head_circum_cm: row.latest_head_circum_cm,
      recorded_at: row.latest_growth_recorded_at
    } : null,
    primary_caregiver_name: row.primary_caregiver_name || null
  })) as BabyWithDetailsDTO[];
}

/**
 * Get a single baby with full details (including latest growth and primary caregiver)
 */
export async function findBabyWithDetailsById(
  babyId: number,
  userId: number
): Promise<BabyWithDetailsDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .input("user_id", sql.BigInt, userId)
    .input("role_primary", sql.Int, ROLE_PRIMARY)
    .query(`
      SELECT
        b.baby_id, b.display_name, b.date_of_birth, b.sex, b.blood_type, b.notes, b.created_at,
        r.role_name AS access_role, cba.can_edit_health, cba.can_edit_activities, cba.can_share,
        lg.weight_kg AS latest_weight_kg,
        lg.length_cm AS latest_length_cm,
        lg.head_circum_cm AS latest_head_circum_cm,
        lg.recorded_at AS latest_growth_recorded_at,
        pc.full_name AS primary_caregiver_name
      FROM babies b
      INNER JOIN caregiver_baby_access cba ON b.baby_id = cba.baby_id AND cba.user_id = @user_id
      INNER JOIN roles r ON cba.access_role = r.role_id
      -- Latest growth metrics
      LEFT JOIN (
        SELECT gm.baby_id, gm.weight_kg, gm.length_cm, gm.head_circum_cm, gm.recorded_at
        FROM growth_metrics gm
        INNER JOIN (
          SELECT baby_id, MAX(recorded_at) AS max_recorded_at
          FROM growth_metrics
          GROUP BY baby_id
        ) latest ON gm.baby_id = latest.baby_id AND gm.recorded_at = latest.max_recorded_at
      ) lg ON b.baby_id = lg.baby_id
      -- Primary caregiver name
      LEFT JOIN caregiver_baby_access pc_access
        ON b.baby_id = pc_access.baby_id AND pc_access.access_role = @role_primary
      LEFT JOIN users pc ON pc_access.user_id = pc.user_id
      WHERE b.baby_id = @baby_id
    `);

  if (!result.recordset[0]) {
    return null;
  }

  const row = result.recordset[0];
  return {
    baby_id: row.baby_id,
    display_name: row.display_name,
    date_of_birth: row.date_of_birth,
    sex: row.sex,
    blood_type: row.blood_type,
    notes: row.notes,
    created_at: row.created_at,
    access_role: row.access_role,
    can_edit_health: row.can_edit_health,
    can_edit_activities: row.can_edit_activities,
    can_share: row.can_share,
    latest_growth: row.latest_growth_recorded_at ? {
      weight_kg: row.latest_weight_kg,
      length_cm: row.latest_length_cm,
      head_circum_cm: row.latest_head_circum_cm,
      recorded_at: row.latest_growth_recorded_at
    } : null,
    primary_caregiver_name: row.primary_caregiver_name || null
  } as BabyWithDetailsDTO;
}
