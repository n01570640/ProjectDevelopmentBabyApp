import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let pool: sql.ConnectionPool | undefined;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("Connected to Azure SQL Database");
  }
  return pool;
}
