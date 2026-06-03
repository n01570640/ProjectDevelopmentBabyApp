import { getDb } from "../db";
import sql from "mssql";
import { SymptomCatalogDTO } from "../dtos/symptom.dto";

/**
 * Get all symptoms from the symptoms_catalog table
 */
export async function findAll(
  transactionRequest?: sql.Request
): Promise<SymptomCatalogDTO[]> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request.query(`
    SELECT symptom_code, symptom_name, description
    FROM symptoms_catalog
    ORDER BY symptom_name
  `);

  return result.recordset as SymptomCatalogDTO[];
}

/**
 * Get a symptom by its code
 */
export async function findByCode(
  code: string,
  transactionRequest?: sql.Request
): Promise<SymptomCatalogDTO | null> {
  const request = transactionRequest ?? (await getDb()).request();

  const result = await request
    .input("symptom_code", sql.VarChar(50), code)
    .query(`
      SELECT symptom_code, symptom_name, description
      FROM symptoms_catalog
      WHERE symptom_code = @symptom_code
    `);

  return result.recordset[0] ?? null;
}
