import { getDb } from "../db";
import sql from "mssql";
import {
  ActivityBreakdownItem,
  GrowthDataPoint,
  ActivityFrequencyPoint,
  SymptomFrequencyPoint,
} from "../dtos/analytics.dto";

/**
 * Get total activity count for a baby
 */
export async function getTotalActivities(babyId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT COUNT(*) as count FROM activities WHERE baby_id = @baby_id`);
  return result.recordset[0].count;
}

/**
 * Get activity count for last N days
 */
export async function getActivitiesLastNDays(babyId: number, days: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .input("days", sql.Int, days)
    .query(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE baby_id = @baby_id
        AND start_time >= DATEADD(DAY, -@days, SYSDATETIME())
    `);
  return result.recordset[0].count;
}

/**
 * Get activity breakdown by type
 */
export async function getActivityBreakdown(babyId: number): Promise<ActivityBreakdownItem[]> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT activity_type, COUNT(*) as count
      FROM activities
      WHERE baby_id = @baby_id
      GROUP BY activity_type
      ORDER BY count DESC
    `);
  return result.recordset as ActivityBreakdownItem[];
}

/**
 * Get latest growth record
 */
export async function getLatestGrowth(babyId: number): Promise<{
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
  recorded_at: string | null;
} | null> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT TOP 1 weight_kg, length_cm, head_circum_cm, recorded_at
      FROM growth_metrics
      WHERE baby_id = @baby_id
      ORDER BY recorded_at DESC
    `);
  return result.recordset[0] || null;
}

/**
 * Get total growth record count
 */
export async function getTotalGrowthRecords(babyId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT COUNT(*) as count FROM growth_metrics WHERE baby_id = @baby_id`);
  return result.recordset[0].count;
}

/**
 * Get symptom log counts
 */
export async function getSymptomCounts(
  babyId: number
): Promise<{ total: number; last_7_days: number; last_30_days: number }> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN started_at >= DATEADD(DAY, -7, SYSDATETIME()) THEN 1 ELSE 0 END) as last_7_days,
        SUM(CASE WHEN started_at >= DATEADD(DAY, -30, SYSDATETIME()) THEN 1 ELSE 0 END) as last_30_days
      FROM symptom_logs
      WHERE baby_id = @baby_id
    `);
  const row = result.recordset[0];
  return {
    total: row.total,
    last_7_days: row.last_7_days,
    last_30_days: row.last_30_days,
  };
}

/**
 * Get medication counts (active = no end_date or end_date in future)
 */
export async function getMedicationCounts(
  babyId: number
): Promise<{ active: number; total: number }> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN end_date IS NULL OR end_date >= CAST(SYSDATETIME() AS DATE) THEN 1 ELSE 0 END) as active
      FROM medications
      WHERE baby_id = @baby_id
    `);
  const row = result.recordset[0];
  return { active: row.active, total: row.total };
}

/**
 * Get total vaccination count
 */
export async function getTotalVaccinations(babyId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT COUNT(*) as count FROM baby_vaccinations WHERE baby_id = @baby_id`);
  return result.recordset[0].count;
}

/**
 * Get upcoming tasks count (status not 'DONE' and due_at in future or null)
 */
export async function getUpcomingTasksCount(babyId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE baby_id = @baby_id
        AND (status IS NULL OR status != 'DONE')
    `);
  return result.recordset[0].count;
}

/**
 * Get upcoming/active reminders count
 */
export async function getUpcomingRemindersCount(babyId: number): Promise<number> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM reminders
      WHERE baby_id = @baby_id
        AND is_active = 1
    `);
  return result.recordset[0].count;
}

// ─── Graph Data Queries ──────────────────────────────────────────

/**
 * Get growth data points over time (for line charts)
 */
export async function getGrowthOverTime(babyId: number): Promise<GrowthDataPoint[]> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT recorded_at, weight_kg, length_cm, head_circum_cm
      FROM growth_metrics
      WHERE baby_id = @baby_id
      ORDER BY recorded_at ASC
    `);
  return result.recordset as GrowthDataPoint[];
}

/**
 * Get activity frequency grouped by week and type (for bar/stacked charts)
 */
export async function getActivityFrequency(babyId: number): Promise<ActivityFrequencyPoint[]> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT
        DATEADD(WEEK, DATEDIFF(WEEK, 0, start_time), 0) as week_start,
        activity_type,
        COUNT(*) as count
      FROM activities
      WHERE baby_id = @baby_id
        AND start_time >= DATEADD(MONTH, -3, SYSDATETIME())
      GROUP BY DATEADD(WEEK, DATEDIFF(WEEK, 0, start_time), 0), activity_type
      ORDER BY week_start ASC, activity_type
    `);
  return result.recordset as ActivityFrequencyPoint[];
}

/**
 * Get symptom frequency grouped by week and code (for trend charts)
 */
export async function getSymptomFrequency(babyId: number): Promise<SymptomFrequencyPoint[]> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT
        DATEADD(WEEK, DATEDIFF(WEEK, 0, started_at), 0) as week_start,
        symptom_code,
        COUNT(*) as count
      FROM symptom_logs
      WHERE baby_id = @baby_id
        AND started_at >= DATEADD(MONTH, -3, SYSDATETIME())
      GROUP BY DATEADD(WEEK, DATEDIFF(WEEK, 0, started_at), 0), symptom_code
      ORDER BY week_start ASC, symptom_code
    `);
  return result.recordset as SymptomFrequencyPoint[];
}
