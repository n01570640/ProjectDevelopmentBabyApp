import { getDb } from "../db";
import sql from "mssql";
import { CreateActivityDTO, ActivityDTO } from "../dtos/activity.dto";

export async function createActivity(data: CreateActivityDTO): Promise<ActivityDTO> {
  const db = await getDb();

  const result = await db.request()
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("activity_type", sql.VarChar(40), data.activity_type)
    .input("start_time", sql.DateTime2, data.start_time)
    .input("end_time", sql.DateTime2, data.end_time || null)
    .input("amount", sql.Decimal(6,2), data.amount || null)
    .input("unit", sql.VarChar(20), data.unit || null)
    .input("diaper_type", sql.VarChar(20), data.diaper_type || null)
    .input("side", sql.VarChar(10), data.side || null)
    .input("quality", sql.TinyInt, data.quality ?? null)
    .input("notes", sql.NVarChar(500), data.notes || null)
    .input("recorded_by", sql.BigInt, data.recorded_by)
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
