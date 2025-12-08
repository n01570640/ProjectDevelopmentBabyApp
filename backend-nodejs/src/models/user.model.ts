import { getDb } from "../db";
import sql from "mssql";
import { UserDTO, UserWithPasswordDTO } from "../dtos/user.dto";

// Insert a new user into the database
export async function createUser(
  email: string,
  password_hash: string,
  full_name: string,
  phone: string | null
): Promise<UserDTO> {
  const db = await getDb();

  // Convert bcrypt hash string to Buffer for varbinary storage
  const passwordBuffer = Buffer.from(password_hash, 'utf8');

  const result = await db
    .request()
    .input("email", sql.NVarChar(255), email)
    .input("password_hash", sql.VarBinary, passwordBuffer)
    .input("full_name", sql.NVarChar(200), full_name)
    .input("phone", sql.NVarChar(40), phone)
    .query(`
      INSERT INTO users (email, password_hash, full_name, phone, created_at, is_active)
      OUTPUT INSERTED.*
      VALUES (@email, @password_hash, @full_name, @phone, SYSDATETIME(), 1)
    `);

  return result.recordset[0] as UserDTO;
}

// Find user by email address (includes password_hash for authentication)
export async function findUserByEmail(email: string): Promise<UserWithPasswordDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("email", sql.NVarChar(255), email)
    .query(`
      SELECT * FROM users WHERE email = @email
    `);

  return result.recordset[0] || null;
}

// Find user by user ID
export async function findUserById(user_id: number): Promise<UserDTO | null> {
  const db = await getDb();

  const result = await db
    .request()
    .input("user_id", sql.BigInt, user_id)
    .query(`
      SELECT * FROM users WHERE user_id = @user_id
    `);

  return result.recordset[0] || null;
}
