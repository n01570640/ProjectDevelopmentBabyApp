import { getDb } from "../db";
import sql from "mssql";
import {
  MedicationDTO,
  CreateMedicationDTO,
  UpdateMedicationDTO,
} from "../dtos/medication.dto";

/**
 * Create medication record
 */
export async function createMedication(
  babyId: number,
  data: CreateMedicationDTO,
  transactionRequest?: sql.Request
): Promise<MedicationDTO> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("baby_id", sql.BigInt, babyId)
    .input("name", sql.NVarChar(200), data.name)
    .input("dosage", sql.NVarChar(100), data.dosage ?? null)
    .input("form", sql.NVarChar(50), data.form ?? null)
    .input("instructions", sql.NVarChar(500), data.instructions ?? null)
    .input("start_date", sql.Date, data.start_date ? new Date(data.start_date) : null)
    .input("end_date", sql.Date, data.end_date ? new Date(data.end_date) : null)
    .input("prescribed_by", sql.NVarChar(200), data.prescribed_by ?? null)
    .query(`
      INSERT INTO medications
        (baby_id, name, dosage, form, instructions, start_date, end_date, prescribed_by)
      OUTPUT INSERTED.*
      VALUES (
        @baby_id, @name, @dosage, @form, @instructions, @start_date, @end_date, @prescribed_by
      )
    `);

  return result.recordset[0] as MedicationDTO;
}

/**
 * Find medication by ID
 */
export async function findMedicationById(
  medId: number,
  transactionRequest?: sql.Request
): Promise<MedicationDTO | null> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("med_id", sql.BigInt, medId)
    .query(`SELECT * FROM medications WHERE med_id = @med_id`);

  return result.recordset[0] || null;
}

/**
 * Get all medications for a baby
 */
export async function findMedicationsByBabyId(
  babyId: number,
  transactionRequest?: sql.Request
): Promise<MedicationDTO[]> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT *
      FROM medications
      WHERE baby_id = @baby_id
      ORDER BY start_date DESC
    `);

  return result.recordset as MedicationDTO[];
}

/**
 * Update medication
 */
export async function updateMedication(
  medId: number,
  data: UpdateMedicationDTO,
  transactionRequest?: sql.Request
): Promise<MedicationDTO | null> {
  const setClauses: string[] = [];
  const request = transactionRequest ?? (await getDb()).request();
  request.input("med_id", sql.BigInt, medId);

  if (data.name !== undefined) {
    setClauses.push("name = @name");
    request.input("name", sql.NVarChar(200), data.name);
  }
  if (data.dosage !== undefined) {
    setClauses.push("dosage = @dosage");
    request.input("dosage", sql.NVarChar(100), data.dosage);
  }
  if (data.form !== undefined) {
    setClauses.push("form = @form");
    request.input("form", sql.NVarChar(50), data.form);
  }
  if (data.instructions !== undefined) {
    setClauses.push("instructions = @instructions");
    request.input("instructions", sql.NVarChar(500), data.instructions);
  }
  if (data.start_date !== undefined) {
    setClauses.push("start_date = @start_date");
    request.input("start_date", sql.Date, new Date(data.start_date));
  }
  if (data.end_date !== undefined) {
    setClauses.push("end_date = @end_date");
    request.input("end_date", sql.Date, new Date(data.end_date));
  }
  if (data.prescribed_by !== undefined) {
    setClauses.push("prescribed_by = @prescribed_by");
    request.input("prescribed_by", sql.NVarChar(200), data.prescribed_by);
  }

  if (setClauses.length === 0) {
    return findMedicationById(medId);
  }

  const result = await request.query(`
    UPDATE medications
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE med_id = @med_id
  `);

  return result.recordset[0] || null;
}

/**
 * Delete medication
 */
export async function deleteMedication(
  medId: number,
  transactionRequest?: sql.Request
): Promise<boolean> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("med_id", sql.BigInt, medId)
    .query(`DELETE FROM medications WHERE med_id = @med_id`);

  return result.rowsAffected[0] > 0;
}

/**
 * Check if medication belongs to baby
 */
export async function medicationBelongsToBaby(
  medId: number,
  babyId: number,
  transactionRequest?: sql.Request
): Promise<boolean> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("med_id", sql.BigInt, medId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM medications
      WHERE med_id = @med_id AND baby_id = @baby_id
    `);

  return result.recordset[0].count > 0;
}
