import { getDb } from "../db";
import sql from "mssql";
import { CreateReminderDTO, UpdateReminderDTO, ReminderDTO } from "../dtos/reminder.dto";

export async function createReminder(data: CreateReminderDTO): Promise<ReminderDTO> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id",    sql.BigInt,        data.baby_id)
    .input("created_by", sql.BigInt,        data.created_by)
    .input("title",      sql.NVarChar(200), data.title)
    .input("body",       sql.NVarChar(500), data.body ?? null)
    .input("due_at",     sql.DateTime2,     data.due_at)
    .input("rrule",      sql.NVarChar(400), data.rrule ?? null)
    .query(`
      INSERT INTO reminders (baby_id, created_by, title, body, due_at, rrule, is_active)
      OUTPUT INSERTED.*
      VALUES (@baby_id, @created_by, @title, @body, @due_at, @rrule, 1)
    `);
  return result.recordset[0] as ReminderDTO;
}

export async function findReminderById(reminderId: number): Promise<ReminderDTO | null> {
  const db = await getDb();
  const result = await db.request()
    .input("reminder_id", sql.BigInt, reminderId)
    .query(`SELECT * FROM reminders WHERE reminder_id = @reminder_id`);
  return (result.recordset[0] as ReminderDTO) ?? null;
}

export async function findRemindersByBabyId(babyId: number): Promise<ReminderDTO[]> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT * FROM reminders WHERE baby_id = @baby_id ORDER BY due_at ASC`);
  return result.recordset as ReminderDTO[];
}

export async function updateReminder(reminderId: number, data: UpdateReminderDTO): Promise<ReminderDTO | null> {
  const db = await getDb();
  const req = db.request().input("reminder_id", sql.BigInt, reminderId);

  const sets: string[] = [];
  if (data.title     !== undefined) { req.input("title",     sql.NVarChar(200), data.title);     sets.push("title = @title"); }
  if (data.body      !== undefined) { req.input("body",      sql.NVarChar(500), data.body);      sets.push("body = @body"); }
  if (data.due_at    !== undefined) { req.input("due_at",    sql.DateTime2,     data.due_at);    sets.push("due_at = @due_at"); }
  if (data.rrule     !== undefined) { req.input("rrule",     sql.NVarChar(400), data.rrule);     sets.push("rrule = @rrule"); }
  if (data.is_active !== undefined) { req.input("is_active", sql.Bit,           data.is_active); sets.push("is_active = @is_active"); }

  if (sets.length === 0) return findReminderById(reminderId);

  const result = await req.query(`
    UPDATE reminders SET ${sets.join(", ")}
    OUTPUT INSERTED.*
    WHERE reminder_id = @reminder_id
  `);
  return (result.recordset[0] as ReminderDTO) ?? null;
}

export async function deleteReminder(reminderId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.request()
    .input("reminder_id", sql.BigInt, reminderId)
    .query(`DELETE FROM reminders WHERE reminder_id = @reminder_id`);
  return (result.rowsAffected[0] ?? 0) > 0;
}
