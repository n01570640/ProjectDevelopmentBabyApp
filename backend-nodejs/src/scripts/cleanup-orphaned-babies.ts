/**
 * Cleanup Orphaned Babies Script
 *
 * Run with: npx ts-node src/scripts/cleanup-orphaned-babies.ts
 *
 * Deletes babies that have no caregiver_baby_access entries,
 * along with any remaining related records.
 */

import { getDb } from "../db";
import sql from "mssql";

async function main() {
  console.log("Cleaning up orphaned babies...\n");

  const db = await getDb();

  // Find orphaned babies (no caregiver access entries)
  const orphaned = await db.request().query(`
    SELECT b.baby_id, b.display_name
    FROM babies b
    LEFT JOIN caregiver_baby_access cba ON b.baby_id = cba.baby_id
    WHERE cba.baby_id IS NULL
  `);

  if (orphaned.recordset.length === 0) {
    console.log("No orphaned babies found.");
    process.exit(0);
  }

  console.log(`Found ${orphaned.recordset.length} orphaned baby(ies):\n`);

  const transaction = new sql.Transaction(db);

  try {
    await transaction.begin();

    for (const baby of orphaned.recordset) {
      console.log(`  - Baby ID ${baby.baby_id}: ${baby.display_name}`);

      await new sql.Request(transaction)
        .input("baby_id", sql.BigInt, baby.baby_id)
        .query(`DELETE FROM share_invites WHERE baby_id = @baby_id`);

      await new sql.Request(transaction)
        .input("baby_id", sql.BigInt, baby.baby_id)
        .query(`DELETE FROM baby_vaccinations WHERE baby_id = @baby_id`);

      await new sql.Request(transaction)
        .input("baby_id", sql.BigInt, baby.baby_id)
        .query(`DELETE FROM growth_metrics WHERE baby_id = @baby_id`);

      await new sql.Request(transaction)
        .input("baby_id", sql.BigInt, baby.baby_id)
        .query(`DELETE FROM babies WHERE baby_id = @baby_id`);

      console.log(`    Deleted.`);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  console.log(`\nCleanup complete. Removed ${orphaned.recordset.length} orphaned baby(ies).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
