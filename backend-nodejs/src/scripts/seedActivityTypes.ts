/**
 * Seeds the activity_types lookup table with all valid activity type values.
 * Run with: npx ts-node src/scripts/seedActivityTypes.ts
 */
import { getDb } from "../db";

const ACTIVITY_TYPES = [
  { activity_type: "feeding",  label: "Feeding" },
  { activity_type: "sleep",    label: "Sleep" },
  { activity_type: "diaper",   label: "Diaper" },
  { activity_type: "play",     label: "Play" },
  { activity_type: "bath",     label: "Bath" },
  { activity_type: "other",    label: "Other" },
];

async function main() {
  console.log("Seeding activity_types...");
  const db = await getDb();

  // Check the table exists
  const check = await db.request().query(
    `SELECT OBJECT_ID('activity_types') AS tid`
  );
  if (!check.recordset[0].tid) {
    console.error("activity_types table does not exist. Skipping.");
    process.exit(1);
  }

  for (const row of ACTIVITY_TYPES) {
    // Upsert: insert if not already present
    await db.request()
      .input("activity_type", row.activity_type)
      .input("label", row.label)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM activity_types WHERE activity_type = @activity_type)
          INSERT INTO activity_types (activity_type, label) VALUES (@activity_type, @label)
        ELSE
          UPDATE activity_types SET label = @label WHERE activity_type = @activity_type
      `);
    console.log(`  ✓ ${row.activity_type}`);
  }

  console.log("Done seeding activity_types.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

