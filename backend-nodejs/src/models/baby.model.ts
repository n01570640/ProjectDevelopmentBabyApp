import { getDb } from "../db";
import sql from "mssql";
import { BabyDTO, CreateBabyDTO } from "../dtos/baby.dto";

// Create a new baby
export async function createBaby(data: CreateBabyDTO): Promise<BabyDTO> {
  const db = await getDb();

  const result = await db.request()
    .input("display_name", sql.NVarChar(200), data.display_name)
    .input("date_of_birth", sql.Date, data.date_of_birth)
    .input("sex", sql.VarChar(10), data.sex || null)
    .input("blood_type", sql.VarChar(3), data.blood_type || null)
    .input("notes", sql.NVarChar, data.notes || null)
    .query(`
      INSERT INTO babies (display_name, date_of_birth, sex, blood_type, notes, created_at)
      OUTPUT INSERTED.*
      VALUES (@display_name, @date_of_birth, @sex, @blood_type, @notes, SYSDATETIME())
    `);

  return result.recordset[0] as BabyDTO;
}

// Find baby by ID
export async function findBabyById(baby_id: number): Promise<BabyDTO | null> {
  const db = await getDb();

  const result = await db.request()
    .input("baby_id", sql.BigInt, baby_id)
    .query(`SELECT * FROM babies WHERE baby_id = @baby_id`);

  return result.recordset[0] || null;
}
