import { getDb } from "../db";
import sql from "mssql";
import { CreateReminderDTO, ReminderDTO } from "../dtos/reminder.dto";

export async function createReminder(data: CreateReminderDTO): Promise<ReminderDTO> {
  const db = await getDb();

  const result = await db.request()
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("created_by", sql.BigInt, data.created_by)
    .input("title", sql.NVarChar(200), data.title)
    .input("body", sql.NVarChar(500), data.body || null)
    .input("due_at", sql.DateTime2, data.due_at)
    .input("rrule", sql.NVarChar(400), data.rrule || null)
    .query(`
      INSERT INTO reminders (
        baby_id, created_by, title, body, due_at, rrule, is_active
      )
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @created_by, @title, @body, @due_at, @rrule, 1
      )
    `);

  return result.recordset[0] as ReminderDTO;
}
