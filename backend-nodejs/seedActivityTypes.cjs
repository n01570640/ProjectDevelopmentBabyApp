// Run with: node seedActivityTypes.cjs
// Must be run from the backend-nodejs directory
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const sql = require("mssql");

const cfg = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: false },
};

const TYPES = [
  { activity_type: "feeding", label: "Feeding" },
  { activity_type: "sleep",   label: "Sleep" },
  { activity_type: "diaper",  label: "Diaper" },
  { activity_type: "play",    label: "Play" },
  { activity_type: "bath",    label: "Bath" },
  { activity_type: "other",   label: "Other" },
];

async function run() {
  console.log("Connecting to:", cfg.server, "/", cfg.database);
  const pool = await sql.connect(cfg);

  for (const row of TYPES) {
    await pool.request()
      .input("at", sql.VarChar(40), row.activity_type)
      .input("lb", sql.NVarChar(100), row.label)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM activity_types WHERE activity_type = @at)
          INSERT INTO activity_types (activity_type, label) VALUES (@at, @lb)
        ELSE
          UPDATE activity_types SET label = @lb WHERE activity_type = @at
      `);
    console.log("  OK:", row.activity_type);
  }

  const check = await pool.request().query("SELECT * FROM activity_types");
  console.log("activity_types table now:", JSON.stringify(check.recordset, null, 2));
  process.exit(0);
}

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });

