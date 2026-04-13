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
    trustServerCertificate: false,
    connectionTimeout: 30000, // 30 seconds
    requestTimeout: 30000,    // 30 seconds for queries
    cancelTimeout: 5000,      // 5 seconds
    pool: {
      max: 10,                // Max connections in pool
      min: 0,
      idleTimeoutMillis: 30000 // Close idle connections after 30s
    }
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
