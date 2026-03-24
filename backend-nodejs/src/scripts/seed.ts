/**
 * Database Seed Script
 *
 * Run with: npx ts-node src/scripts/seed.ts
 *
 * Seeds catalog/reference tables:
 *   - vaccines_catalog  (hardcoded CDC schedule)
 *   - symptoms_catalog  (driven by SYMPTOMS_CATALOG array)
 */

import { getDb } from "../db";
import sql from "mssql";
import { SYMPTOMS_CATALOG } from "../data/symptoms.data";

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

  // Upsert vaccine data using MERGE pattern (safe for existing records)
  await db.request().query(`
    SET IDENTITY_INSERT vaccines_catalog ON;

    MERGE vaccines_catalog AS target
    USING (VALUES
      -- 2 Months
      (1, 'DTaP-IPV-Hib (5-in-1) - 1st dose', 8, '2 months; protects against diphtheria, tetanus, pertussis, polio, and Haemophilus influenzae type b'),
      (2, 'Pneu-C (Pneumococcal Conjugate) - 1st dose', 8, '2 months; Pneu-C-15 for healthy children'),
      (3, 'Rotavirus (Rotarix) - 1st dose', 8, '2 months; given orally; 1st dose must be given before 15 weeks of age'),
      -- 4 Months
      (4, 'DTaP-IPV-Hib (5-in-1) - 2nd dose', 16, '4 months'),
      (5, 'Pneu-C (Pneumococcal Conjugate) - 2nd dose', 16, '4 months'),
      (6, 'Rotavirus (Rotarix) - 2nd dose', 16, '4 months; final dose; minimum 4 weeks after 1st dose; all doses must be completed by 25 weeks of age'),
      -- 6 Months
      (7, 'DTaP-IPV-Hib (5-in-1) - 3rd dose', 24, '6 months'),
      (8, 'Influenza (Flu) - Annual', 24, '6 months and older; 2 doses in first flu season (4 weeks apart), then 1 dose annually each fall'),
      -- 12 Months
      (9, 'Pneu-C (Pneumococcal Conjugate) - 3rd dose (booster)', 52, '12 months; must be given no earlier than 1st birthday'),
      (10, 'Men-C-C (Meningococcal Conjugate) - 1st dose', 52, '12 months; must be given no earlier than 1st birthday; protects against meningococcal disease (C strain); required for school attendance'),
      (11, 'MMR (Measles, Mumps, Rubella) - 1st dose', 52, '12 months; must be given no earlier than 1st birthday; required for school attendance in Ontario'),
      -- 15 Months
      (12, 'Varicella (Chickenpox) - 1st dose', 65, '15 months; required for school attendance in Ontario (children born on or after Jan 1, 2010)'),
      -- 18 Months
      (13, 'DTaP-IPV-Hib (5-in-1) - 4th dose', 78, '18 months'),
      -- 4-6 Years
      (14, 'Tdap-IPV (4-in-1 booster)', 208, '4-6 years; booster for tetanus, diphtheria, pertussis, and polio; do not give before 4th birthday; required for school attendance'),
      (15, 'MMRV (Measles, Mumps, Rubella, Varicella) - 2nd dose', 208, '4-6 years; combined vaccine for 2nd doses of MMR and varicella; approved for ages 4 to <13 years; required for school attendance'),
      -- Grade 7 (~age 12, school-based program)
      (16, 'Men-C-ACYW (Meningococcal Quadrivalent)', 624, 'Grade 7 (~age 12); single dose; covers strains A, C, Y, W-135; different from Men-C-C given at 12 months; required for school attendance under ISPA'),
      (17, 'Hepatitis B (HB) - 1st dose', 624, 'Grade 7 (~age 12); school-based program; 2-dose series for students aged 11-15; strongly recommended but not required for school attendance'),
      (18, 'HPV-9 (Human Papillomavirus) - 1st dose', 624, 'Grade 7 (~age 12); school-based program; 2-dose series (0, 6 months) for healthy students under 15; protects against 9 types of HPV; strongly recommended but not required for school attendance'),
      (19, 'Hepatitis B (HB) - 2nd dose', 650, '6 months after 1st dose; completes 2-dose series for students aged 11-15; students 16+ require a 3-dose series'),
      (20, 'HPV-9 (Human Papillomavirus) - 2nd dose', 650, '6 months after 1st dose; completes 2-dose series for healthy students under 15; students 15+ or immunocompromised require a 3-dose series')
    ) AS source (vaccine_id, vaccine_name, schedule_weeks, notes)
    ON target.vaccine_id = source.vaccine_id
    WHEN MATCHED THEN
      UPDATE SET
        vaccine_name = source.vaccine_name,
        schedule_weeks = source.schedule_weeks,
        notes = source.notes
    WHEN NOT MATCHED THEN
      INSERT (vaccine_id, vaccine_name, schedule_weeks, notes)
      VALUES (source.vaccine_id, source.vaccine_name, source.schedule_weeks, source.notes)
    WHEN NOT MATCHED BY SOURCE THEN
      DELETE;

    SET IDENTITY_INSERT vaccines_catalog OFF;
  `);

  console.log("  Inserted 20 CDC-recommended vaccines");
}

async function seedSymptomsCatalog() {
  const db = await getDb();

  // Check if table exists
  const tableCheck = await db.request().query(`
    SELECT OBJECT_ID('symptoms_catalog') AS table_id
  `);

  if (!tableCheck.recordset[0].table_id) {
    console.log("  symptoms_catalog table does not exist. Skipping.");
    return;
  }

  // Use parameterized MERGE for each symptom from the in-memory catalog
  for (const symptom of SYMPTOMS_CATALOG) {
    const request = db.request();
    await request
      .input("symptom_code", sql.VarChar(50), symptom.symptom_code)
      .input("symptom_name", sql.NVarChar(200), symptom.symptom_name)
      .input("description", sql.NVarChar(500), symptom.description)
      .query(`
        MERGE symptoms_catalog AS target
        USING (SELECT @symptom_code AS symptom_code) AS source
        ON target.symptom_code = source.symptom_code
        WHEN MATCHED THEN
          UPDATE SET
            symptom_name = @symptom_name,
            description = @description
        WHEN NOT MATCHED THEN
          INSERT (symptom_code, symptom_name, description)
          VALUES (@symptom_code, @symptom_name, @description);
      `);
  }

  // Remove any catalog rows that are no longer in the source array
  const codes = SYMPTOMS_CATALOG.map((s) => s.symptom_code);
  const placeholders = codes.map((_, i) => `@code${i}`).join(", ");
  const cleanupRequest = db.request();
  codes.forEach((code, i) => {
    cleanupRequest.input(`code${i}`, sql.VarChar(50), code);
  });
  await cleanupRequest.query(`
    DELETE FROM symptoms_catalog
    WHERE symptom_code NOT IN (${placeholders})
  `);

  console.log(`  Upserted ${SYMPTOMS_CATALOG.length} symptom codes`);
}

async function main() {
  console.log("===================================================");
  console.log("   Baby Tracking App - Catalog Seeder");
  console.log("===================================================\n");

  try {
    console.log("Seeding vaccines_catalog...");
    await seedVaccinesCatalog();

    console.log("Seeding symptoms_catalog...");
    await seedSymptomsCatalog();

    console.log("\n===================================================");
    console.log("Seeding complete!");
    console.log("===================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  }
}

main();
