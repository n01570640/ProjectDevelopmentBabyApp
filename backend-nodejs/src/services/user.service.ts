import { getDb } from "../db";
import { CreateUserDTO, UserDTO } from "../dtos/user.dto";
import sql from "mssql";
import crypto from "crypto";

export async function createUser(data: CreateUserDTO): Promise<UserDTO> {
  const db = await getDb();

  // Hash password
  const hashedPassword = crypto.createHash("sha256").update(data.password).digest();

  const result = await db.request()
    .input("email", sql.NVarChar(255), data.email)
    .input("password_hash", sql.VarBinary, hashedPassword)
    .input("full_name", sql.NVarChar(200), data.full_name)
    .input("phone", sql.NVarChar(40), data.phone || null)
    .query(`
      INSERT INTO users (email, password_hash, full_name, phone, created_at, is_active)
      OUTPUT INSERTED.*
      VALUES (@email, @password_hash, @full_name, @phone, SYSDATETIME(), 1)
    `);

  return result.recordset[0] as UserDTO;
}
