import { getDb } from "../db";
import sql from "mssql";
import { CreateTaskDTO, TaskDTO } from "../dtos/task.dto";

export async function createTask(data: CreateTaskDTO): Promise<TaskDTO> {
  const db = await getDb();

  const result = await db.request()
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("created_by", sql.BigInt, data.created_by)
    .input("assigned_to", sql.BigInt, data.assigned_to || null)
    .input("title", sql.NVarChar(200), data.title)
    .input("description", sql.NVarChar(1000), data.description || null)
    .input("due_at", sql.DateTime2, data.due_at || null)
    .input("status", sql.VarChar(20), data.status || "pending")
    .query(`
      INSERT INTO tasks (
        baby_id, created_by, assigned_to, title, description, due_at, status
      )
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @created_by, @assigned_to, @title, @description, @due_at, @status
      )
    `);

  return result.recordset[0] as TaskDTO;
}
