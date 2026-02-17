import { getDb } from "../db";
import sql from "mssql";
import {
  GrowthDTO,
  CreateGrowthDTO,
  UpdateGrowthDTO,
  LatestGrowthDTO,
} from "../dtos/growth.dto";

/**
 * Create growth record
 */
export async function createGrowth(
  babyId: number,
  recordedBy: number,
  data: CreateGrowthDTO
): Promise<GrowthDTO> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .input("weight_kg", sql.Decimal(5, 2), data.weight_kg || null)
    .input("length_cm", sql.Decimal(5, 2), data.length_cm || null)
    .input("head_circum_cm", sql.Decimal(5, 2), data.head_circum_cm || null)
    .input("notes", sql.NVarChar(500), data.notes || null)
    .input("recorded_by", sql.BigInt, recordedBy)
    .input("recorded_at", sql.DateTime2, data.recorded_at ? new Date(data.recorded_at) : null)
    .query(`
      INSERT INTO growth_metrics
        (baby_id, weight_kg, length_cm, head_circum_cm, notes, recorded_by, recorded_at)
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @weight_kg, @length_cm, @head_circum_cm, @notes, @recorded_by,
        COALESCE(@recorded_at, SYSDATETIME())
      )
    `);

  return result.recordset[0] as GrowthDTO;
}

/**
 * Find growth record by ID
 */
export async function findGrowthById(growthId: number): Promise<GrowthDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("growth_id", sql.BigInt, growthId)
    .query(`SELECT * FROM growth_metrics WHERE growth_id = @growth_id`);

  return result.recordset[0] || null;
}

/**
 * Get all growth records for a baby (sorted by date DESC)
 */
export async function findGrowthByBabyId(babyId: number): Promise<GrowthDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT *
      FROM growth_metrics
      WHERE baby_id = @baby_id
      ORDER BY recorded_at DESC
    `);

  return result.recordset as GrowthDTO[];
}

/**
 * Get latest growth record for a baby
 */
export async function findLatestGrowth(babyId: number): Promise<LatestGrowthDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT TOP 1
        weight_kg, length_cm, head_circum_cm, recorded_at
      FROM growth_metrics
      WHERE baby_id = @baby_id
      ORDER BY recorded_at DESC
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0] as LatestGrowthDTO;
}

/**
 * Update growth record
 */
export async function updateGrowth(
  growthId: number,
  data: UpdateGrowthDTO
): Promise<GrowthDTO | null> {
  const db = await getDb();

  // Build dynamic update query
  const setClauses: string[] = [];
  const request = db.request();
  request.input("growth_id", sql.BigInt, growthId);

  if (data.weight_kg !== undefined) {
    setClauses.push("weight_kg = @weight_kg");
    request.input("weight_kg", sql.Decimal(5, 2), data.weight_kg);
  }
  if (data.length_cm !== undefined) {
    setClauses.push("length_cm = @length_cm");
    request.input("length_cm", sql.Decimal(5, 2), data.length_cm);
  }
  if (data.head_circum_cm !== undefined) {
    setClauses.push("head_circum_cm = @head_circum_cm");
    request.input("head_circum_cm", sql.Decimal(5, 2), data.head_circum_cm);
  }
  if (data.notes !== undefined) {
    setClauses.push("notes = @notes");
    request.input("notes", sql.NVarChar(500), data.notes);
  }
  if (data.recorded_at !== undefined) {
    setClauses.push("recorded_at = @recorded_at");
    request.input("recorded_at", sql.DateTime2, new Date(data.recorded_at));
  }

  if (setClauses.length === 0) {
    return findGrowthById(growthId);
  }

  const result = await request.query(`
    UPDATE growth_metrics
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE growth_id = @growth_id
  `);

  return result.recordset[0] || null;
}

/**
 * Delete growth record
 */
export async function deleteGrowth(growthId: number): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("growth_id", sql.BigInt, growthId)
    .query(`DELETE FROM growth_metrics WHERE growth_id = @growth_id`);

  return result.rowsAffected[0] > 0;
}

/**
 * Check if growth record belongs to baby
 */
export async function growthBelongsToBaby(
  growthId: number,
  babyId: number
): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("growth_id", sql.BigInt, growthId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM growth_metrics
      WHERE growth_id = @growth_id AND baby_id = @baby_id
    `);

  return result.recordset[0].count > 0;
}
