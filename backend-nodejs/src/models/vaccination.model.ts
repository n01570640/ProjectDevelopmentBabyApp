import { getDb } from "../db";
import sql from "mssql";
import {
  VaccinationDTO,
  VaccinationWithVaccineDTO,
  CreateVaccinationDTO,
  UpdateVaccinationDTO,
} from "../dtos/vaccination.dto";
import { getVaccineById } from "../data/vaccines.data";

/**
 * Create vaccination record
 */
export async function createVaccination(
  babyId: number,
  recordedBy: number,
  data: CreateVaccinationDTO
): Promise<VaccinationWithVaccineDTO> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .input("vaccine_id", sql.Int, data.vaccine_id)
    .input("administered_on", sql.Date, data.administered_on)
    .input("clinic", sql.NVarChar(200), data.clinic || null)
    .input("lot_number", sql.NVarChar(100), data.lot_number || null)
    .input("administered_by", sql.NVarChar(200), data.administered_by || null)
    .input("recorded_by", sql.BigInt, recordedBy)
    .query(`
      INSERT INTO baby_vaccinations
        (baby_id, vaccine_id, administered_on, clinic, lot_number, administered_by, recorded_by)
      OUTPUT INSERTED.*
      VALUES (@baby_id, @vaccine_id, @administered_on, @clinic, @lot_number, @administered_by, @recorded_by)
    `);

  const vaccination = result.recordset[0] as VaccinationDTO;
  return enrichWithVaccineInfo(vaccination);
}

/**
 * Find vaccination by ID
 */
export async function findVaccinationById(
  vaccinationId: number
): Promise<VaccinationWithVaccineDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_vax_id", sql.BigInt, vaccinationId)
    .query(`SELECT * FROM baby_vaccinations WHERE baby_vax_id = @baby_vax_id`);

  if (result.recordset.length === 0) {
    return null;
  }

  return enrichWithVaccineInfo(result.recordset[0] as VaccinationDTO);
}

/**
 * Get all vaccinations for a baby
 */
export async function findVaccinationsByBabyId(
  babyId: number
): Promise<VaccinationWithVaccineDTO[]> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT *
      FROM baby_vaccinations
      WHERE baby_id = @baby_id
      ORDER BY administered_on DESC
    `);

  return result.recordset.map((v) =>
    enrichWithVaccineInfo(v as VaccinationDTO)
  );
}

/**
 * Update vaccination record
 */
export async function updateVaccination(
  vaccinationId: number,
  data: UpdateVaccinationDTO
): Promise<VaccinationWithVaccineDTO | null> {
  const db = await getDb();

  // Build dynamic update query
  const setClauses: string[] = [];
  const request = db.request();
  request.input("baby_vax_id", sql.BigInt, vaccinationId);

  if (data.vaccine_id !== undefined) {
    setClauses.push("vaccine_id = @vaccine_id");
    request.input("vaccine_id", sql.Int, data.vaccine_id);
  }
  if (data.administered_on !== undefined) {
    setClauses.push("administered_on = @administered_on");
    request.input("administered_on", sql.Date, data.administered_on);
  }
  if (data.clinic !== undefined) {
    setClauses.push("clinic = @clinic");
    request.input("clinic", sql.NVarChar(200), data.clinic);
  }
  if (data.lot_number !== undefined) {
    setClauses.push("lot_number = @lot_number");
    request.input("lot_number", sql.NVarChar(100), data.lot_number);
  }
  if (data.administered_by !== undefined) {
    setClauses.push("administered_by = @administered_by");
    request.input("administered_by", sql.NVarChar(200), data.administered_by);
  }

  if (setClauses.length === 0) {
    return findVaccinationById(vaccinationId);
  }

  const result = await request.query(`
    UPDATE baby_vaccinations
    SET ${setClauses.join(", ")}
    OUTPUT INSERTED.*
    WHERE baby_vax_id = @baby_vax_id
  `);

  if (result.recordset.length === 0) {
    return null;
  }

  return enrichWithVaccineInfo(result.recordset[0] as VaccinationDTO);
}

/**
 * Delete vaccination record
 */
export async function deleteVaccination(vaccinationId: number): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_vax_id", sql.BigInt, vaccinationId)
    .query(`DELETE FROM baby_vaccinations WHERE baby_vax_id = @baby_vax_id`);

  return result.rowsAffected[0] > 0;
}

/**
 * Check if vaccination belongs to baby
 */
export async function vaccinationBelongsToBaby(
  vaccinationId: number,
  babyId: number
): Promise<boolean> {
  const db = await getDb();

  const result = await db
    .request()
    .input("baby_vax_id", sql.BigInt, vaccinationId)
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT COUNT(*) as count
      FROM baby_vaccinations
      WHERE baby_vax_id = @baby_vax_id AND baby_id = @baby_id
    `);

  return result.recordset[0].count > 0;
}

/**
 * Add vaccine info from hardcoded catalog to vaccination record
 */
function enrichWithVaccineInfo(
  vaccination: VaccinationDTO
): VaccinationWithVaccineDTO {
  const vaccine = getVaccineById(vaccination.vaccine_id);

  return {
    ...vaccination,
    vaccine_name: vaccine?.vaccine_name || "Unknown Vaccine",
    schedule_weeks: vaccine?.schedule_weeks || 0,
  };
}
