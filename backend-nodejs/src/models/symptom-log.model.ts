import { getDb } from "../db";
import sql from "mssql";
import {
  SymptomLogDTO,
  CreateSymptomLogDTO,
  UpdateSymptomLogDTO,
} from "../dtos/symptom.dto";

/**
 * Create symptom log
 */
export async function createSymptomLog(
  babyId: number,
  recordedBy: number,
  data: CreateSymptomLogDTO,
  transactionRequest?: sql.Request
): Promise<SymptomLogDTO> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("baby_id", sql.BigInt, babyId)
    .input("symptom_code", sql.VarChar(50), data.symptom_code)
    .input("started_at", sql.DateTime2, data.started_at ? new Date(data.started_at) : null)
    .input("severity_1_5", sql.TinyInt, data.severity_1_5 ?? null)
    .input("trigger_note", sql.NVarChar(300), data.trigger_note ?? null)
    .input("associated_med_id", sql.BigInt, data.associated_med_id ?? null)
    .input("notes", sql.NVarChar(1000), data.notes ?? null)
    .input("recorded_by", sql.BigInt, recordedBy)
    .query(`
      INSERT INTO symptom_logs
        (baby_id, symptom_code, started_at, severity_1_5, trigger_note, associated_med_id, notes, recorded_by)
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @symptom_code, COALESCE(@started_at, SYSDATETIME()),
        @severity_1_5, @trigger_note, @associated_med_id, @notes, @recorded_by
      )
    `);

  return result.recordset[0] as SymptomLogDTO;
}

/**
 * Find symptom log by ID
 */
export async function findSymptomLogById(
  symptomLogId: number,
  transactionRequest?: sql.Request
): Promise<SymptomLogDTO | null> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("symptom_log_id", sql.BigInt, symptomLogId)
    .query(`SELECT * FROM symptom_logs WHERE symptom_log_id = @symptom_log_id`);

  return result.recordset[0] || null;
}

/**
 * Get all symptom logs for a baby with optional filters
 */
export async function findSymptomLogsByBabyId(
  babyId: number,
  filters?: { from?: string; to?: string; symptom_code?: string },
  transactionRequest?: sql.Request
): Promise<SymptomLogDTO[]> {
  const request = transactionRequest ?? (await getDb()).request();
  request.input("baby_id", sql.BigInt, babyId);

  const whereClauses: string[] = ["baby_id = @baby_id"];

  if (filters?.from) {
    whereClauses.push("started_at >= @from_date");
    request.input("from_date", sql.DateTime2, new Date(filters.from));
  }
  if (filters?.to) {
    whereClauses.push("started_at <= @to_date");
    request.input("to_date", sql.DateTime2, new Date(filters.to));
  }
  if (filters?.symptom_code) {
    whereClauses.push("symptom_code = @symptom_code");
    request.input("symptom_code", sql.VarChar(50), filters.symptom_code);
  }

  const result = await request.query(`
    SELECT *
    FROM symptom_logs
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY started_at DESC
  `);

  return result.recordset as SymptomLogDTO[];
}

/**
 * Update symptom log
 */
export async function updateSymptomLog(
  symptomLogId: number,
  data: UpdateSymptomLogDTO,
  transactionRequest?: sql.Request
): Promise<SymptomLogDTO | null> {
  const setClauses: string[] = [];
  const request = transactionRequest ?? (await getDb()).request();
  request.input("symptom_log_id", sql.BigInt, symptomLogId);

  if (data.symptom_code !== undefined) {
    setClauses.push("symptom_code = @symptom_code");
    request.input("symptom_code", sql.VarChar(50), data.symptom_code);
  }
  if (data.started_at !== undefined) {
    setClauses.push("started_at = @started_at");
    request.input("started_at", sql.DateTime2, new Date(data.started_at));
  }
  if (data.severity_1_5 !== undefined) {
    setClauses.push("severity_1_5 = @severity_1_5");
    request.input("severity_1_5", sql.TinyInt, data.severity_1_5);
  }
  if (data.trigger_note !== undefined) {
    setClauses.push("trigger_note = @trigger_note");
    request.input("trigger_note", sql.NVarChar(300), data.trigger_note);
  }
  if (data.associated_med_id !== undefined) {
    setClauses.push("associated_med_id = @associated_med_id");
    request.input("associated_med_id", sql.BigInt, data.associated_med_id);
  }
  if (data.notes !== undefined) {
    setClauses.push("notes = @notes");
    request.input("notes", sql.NVarChar(1000), data.notes);
  }

  if (setClauses.length === 0) {
    return findSymptomLogById(symptomLogId);
  }

  const result = await request.query(`
    UPDATE symptom_logs
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE symptom_log_id = @symptom_log_id
  `);

  return result.recordset[0] || null;
}

/**
 * Delete symptom log
 */
export async function deleteSymptomLog(
  symptomLogId: number,
  transactionRequest?: sql.Request
): Promise<boolean> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("symptom_log_id", sql.BigInt, symptomLogId)
    .query(`DELETE FROM symptom_logs WHERE symptom_log_id = @symptom_log_id`);

  return result.rowsAffected[0] > 0;
}

/**
 * Check if symptom log belongs to baby
 */
export async function symptomLogBelongsToBaby(
  symptomLogId: number,
  babyId: number,
  transactionRequest?: sql.Request
): Promise<boolean> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("symptom_log_id", sql.BigInt, symptomLogId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM symptom_logs
      WHERE symptom_log_id = @symptom_log_id AND baby_id = @baby_id
    `);

  return result.recordset[0].count > 0;
}
