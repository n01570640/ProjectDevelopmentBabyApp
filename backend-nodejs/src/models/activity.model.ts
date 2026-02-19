import { getDb } from "../db";
import sql from "mssql";
import { CreateActivityDTO, UpdateActivityDTO, ActivityDTO } from "../dtos/activity.dto";

export async function createActivity(data: CreateActivityDTO): Promise<ActivityDTO> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id",      sql.BigInt,       data.baby_id)
    .input("activity_type",sql.VarChar(40),  data.activity_type)
    .input("start_time",   sql.DateTime2,    data.start_time)
    .input("end_time",     sql.DateTime2,    data.end_time ?? null)
    .input("amount",       sql.Decimal(6,2), data.amount ?? null)
    .input("unit",         sql.VarChar(20),  data.unit ?? null)
    .input("diaper_type",  sql.VarChar(20),  data.diaper_type ?? null)
    .input("side",         sql.VarChar(10),  data.side ?? null)
    .input("quality",      sql.TinyInt,      data.quality ?? null)
    .input("notes",        sql.NVarChar(500),data.notes ?? null)
    .input("recorded_by",  sql.BigInt,       data.recorded_by)
    .query(`
      INSERT INTO activities (
        baby_id, activity_type, start_time, end_time, amount, unit,
        diaper_type, side, quality, notes, recorded_by
      )
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @activity_type, @start_time, @end_time, @amount, @unit,
        @diaper_type, @side, @quality, @notes, @recorded_by
      )
    `);
  return result.recordset[0] as ActivityDTO;
}

export async function findActivityById(activityId: number): Promise<ActivityDTO | null> {
  const db = await getDb();
  const result = await db.request()
    .input("activity_id", sql.BigInt, activityId)
    .query(`SELECT * FROM activities WHERE activity_id = @activity_id`);
  return (result.recordset[0] as ActivityDTO) ?? null;
}

export async function findActivitiesByBabyId(babyId: number): Promise<ActivityDTO[]> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT * FROM activities WHERE baby_id = @baby_id ORDER BY start_time DESC`);
  return result.recordset as ActivityDTO[];
}

export async function updateActivity(
  activityId: number,
  data: UpdateActivityDTO
): Promise<ActivityDTO | null> {
  const db = await getDb();
  const req = db.request().input("activity_id", sql.BigInt, activityId);

  const sets: string[] = [];
  if (data.activity_type !== undefined) { req.input("activity_type", sql.VarChar(40),  data.activity_type); sets.push("activity_type = @activity_type"); }
  if (data.start_time    !== undefined) { req.input("start_time",    sql.DateTime2,    data.start_time);    sets.push("start_time = @start_time"); }
  if (data.end_time      !== undefined) { req.input("end_time",      sql.DateTime2,    data.end_time);      sets.push("end_time = @end_time"); }
  if (data.amount        !== undefined) { req.input("amount",        sql.Decimal(6,2), data.amount);        sets.push("amount = @amount"); }
  if (data.unit          !== undefined) { req.input("unit",          sql.VarChar(20),  data.unit);          sets.push("unit = @unit"); }
  if (data.diaper_type   !== undefined) { req.input("diaper_type",   sql.VarChar(20),  data.diaper_type);   sets.push("diaper_type = @diaper_type"); }
  if (data.side          !== undefined) { req.input("side",          sql.VarChar(10),  data.side);          sets.push("side = @side"); }
  if (data.quality       !== undefined) { req.input("quality",       sql.TinyInt,      data.quality);       sets.push("quality = @quality"); }
  if (data.notes         !== undefined) { req.input("notes",         sql.NVarChar(500),data.notes);         sets.push("notes = @notes"); }

  if (sets.length === 0) return findActivityById(activityId);

  const result = await req.query(`
    UPDATE activities SET ${sets.join(", ")}
    OUTPUT INSERTED.*
    WHERE activity_id = @activity_id
  `);
  return (result.recordset[0] as ActivityDTO) ?? null;
}

export async function deleteActivity(activityId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.request()
    .input("activity_id", sql.BigInt, activityId)
    .query(`DELETE FROM activities WHERE activity_id = @activity_id`);
  return (result.rowsAffected[0] ?? 0) > 0;
}
