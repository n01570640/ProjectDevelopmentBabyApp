/**
 * Database Seed Script
 *
 * Run with: npx ts-node src/scripts/seed.ts
 *
 * Seeds the vaccines_catalog table with CDC-recommended vaccine schedule.
 * Drops and recreates data for a clean load every run.
 */

import { getDb } from "../db";

async function seedVaccinesCatalog() {
  const db = await getDb();

  // Check if table exists
  const tableCheck = await db.request().query(`
    SELECT OBJECT_ID('vaccines_catalog') AS table_id
  `);

  if (!tableCheck.recordset[0].table_id) {
    console.log("  vaccines_catalog table does not exist. Skipping.");
    return;
  }

  // Clear existing data
  await db.request().query(`DELETE FROM vaccines_catalog`);
  console.log("  Cleared existing vaccines_catalog data");

  // Insert CDC vaccine schedule
  await db.request().query(`
    SET IDENTITY_INSERT vaccines_catalog ON;
    INSERT INTO vaccines_catalog (vaccine_id, vaccine_name, schedule_weeks, notes) VALUES
    (1, 'Hepatitis B (HepB) - 1st dose', 0, 'Administer at birth'),
    (2, 'Hepatitis B (HepB) - 2nd dose', 4, '1-2 months'),
    (3, 'DTaP - 1st dose', 8, '2 months'),
    (4, 'Hib - 1st dose', 8, '2 months'),
    (5, 'IPV (Polio) - 1st dose', 8, '2 months'),
    (6, 'PCV13 - 1st dose', 8, '2 months'),
    (7, 'RV (Rotavirus) - 1st dose', 8, '2 months'),
    (8, 'DTaP - 2nd dose', 16, '4 months'),
    (9, 'Hib - 2nd dose', 16, '4 months'),
    (10, 'IPV - 2nd dose', 16, '4 months'),
    (11, 'PCV13 - 2nd dose', 16, '4 months'),
    (12, 'RV - 2nd dose', 16, '4 months'),
    (13, 'DTaP - 3rd dose', 24, '6 months'),
    (14, 'Hib - 3rd dose', 24, '6 months'),
    (15, 'PCV13 - 3rd dose', 24, '6 months'),
    (16, 'RV - 3rd dose', 24, '6 months (RotaTeq only)'),
    (17, 'Influenza - Annual', 24, '6 months and older'),
    (18, 'Hepatitis B - 3rd dose', 26, '6-18 months'),
    (19, 'IPV - 3rd dose', 26, '6-18 months'),
    (20, 'Hib - Final dose', 52, '12-15 months'),
    (21, 'PCV13 - 4th dose', 52, '12-15 months'),
    (22, 'MMR - 1st dose', 52, '12-15 months'),
    (23, 'Varicella - 1st dose', 52, '12-15 months'),
    (24, 'Hepatitis A - 1st dose', 52, '12-23 months'),
    (25, 'DTaP - 4th dose', 65, '15-18 months'),
    (26, 'Hepatitis A - 2nd dose', 78, '18+ months'),
    (27, 'DTaP - 5th dose', 208, '4-6 years'),
    (28, 'IPV - 4th dose', 208, '4-6 years'),
    (29, 'MMR - 2nd dose', 208, '4-6 years'),
    (30, 'Varicella - 2nd dose', 208, '4-6 years');
    SET IDENTITY_INSERT vaccines_catalog OFF;
  `);

  console.log("  Inserted 30 CDC-recommended vaccines");
}

async function main() {
  console.log("===================================================");
  console.log("   Baby Tracking App - Vaccines Catalog Seeder");
  console.log("===================================================\n");

  try {
    console.log("Seeding vaccines_catalog...");
    await seedVaccinesCatalog();

    console.log("\n===================================================");
    console.log("Seeding complete! 30 vaccines loaded.");
    console.log("===================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  }
}

main();
