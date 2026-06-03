import { getDb } from "../db";
import sql from "mssql";
import { CreateTaskDTO, UpdateTaskDTO, TaskDTO } from "../dtos/task.dto";

export async function createTask(data: CreateTaskDTO): Promise<TaskDTO> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id",     sql.BigInt,        data.baby_id)
    .input("created_by",  sql.BigInt,        data.created_by)
    .input("assigned_to", sql.BigInt,        data.assigned_to ?? null)
    .input("title",       sql.NVarChar(200), data.title)
    .input("description", sql.NVarChar(1000),data.description ?? null)
    .input("due_at",      sql.DateTime2,     data.due_at ?? null)
    .input("status",      sql.VarChar(20),   data.status ?? "pending")
    .query(`
      INSERT INTO tasks (baby_id, created_by, assigned_to, title, description, due_at, status)
      OUTPUT INSERTED.*
      VALUES (@baby_id, @created_by, @assigned_to, @title, @description, @due_at, @status)
    `);
  return result.recordset[0] as TaskDTO;
}

export async function findTaskById(taskId: number): Promise<TaskDTO | null> {
  const db = await getDb();
  const result = await db.request()
    .input("task_id", sql.BigInt, taskId)
    .query(`SELECT * FROM tasks WHERE task_id = @task_id`);
  return (result.recordset[0] as TaskDTO) ?? null;
}

export async function findTasksByBabyId(babyId: number): Promise<TaskDTO[]> {
  const db = await getDb();
  const result = await db.request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT * FROM tasks WHERE baby_id = @baby_id ORDER BY due_at ASC`);
  return result.recordset as TaskDTO[];
}

export async function updateTask(taskId: number, data: UpdateTaskDTO): Promise<TaskDTO | null> {
  const db = await getDb();
  const req = db.request().input("task_id", sql.BigInt, taskId);

  const sets: string[] = [];
  if (data.title       !== undefined) { req.input("title",       sql.NVarChar(200),  data.title);       sets.push("title = @title"); }
  if (data.description !== undefined) { req.input("description", sql.NVarChar(1000), data.description); sets.push("description = @description"); }
  if (data.due_at      !== undefined) { req.input("due_at",      sql.DateTime2,      data.due_at);      sets.push("due_at = @due_at"); }
  if (data.status      !== undefined) { req.input("status",      sql.VarChar(20),    data.status);      sets.push("status = @status"); }
  if (data.assigned_to !== undefined) { req.input("assigned_to", sql.BigInt,         data.assigned_to); sets.push("assigned_to = @assigned_to"); }

  if (sets.length === 0) return findTaskById(taskId);

  const result = await req.query(`
    UPDATE tasks SET ${sets.join(", ")}
    OUTPUT INSERTED.*
    WHERE task_id = @task_id
  `);
  return (result.recordset[0] as TaskDTO) ?? null;
}

export async function deleteTask(taskId: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.request()
    .input("task_id", sql.BigInt, taskId)
    .query(`DELETE FROM tasks WHERE task_id = @task_id`);
  return (result.rowsAffected[0] ?? 0) > 0;
}
