import * as symptomLogModel from "../models/symptom-log.model";
import * as symptomCatalogModel from "../models/symptom-catalog.model";
import {
  CreateSymptomLogDTO,
  UpdateSymptomLogDTO,
  SymptomLogDTO,
} from "../dtos/symptom.dto";

/**
 * List all symptoms from the catalog
 */
export async function listSymptoms() {
  return await symptomCatalogModel.findAll();
}

/**
 * Get a single symptom by code from the catalog
 */
export async function getSymptomByCode(code: string) {
  return await symptomCatalogModel.findByCode(code);
}

/**
 * Create symptom log with business validation
 */
export async function createSymptomLog(
  babyId: number,
  recordedBy: number,
  data: CreateSymptomLogDTO
): Promise<SymptomLogDTO> {
  // Validate symptom code exists in DB catalog
  const symptom = await symptomCatalogModel.findByCode(data.symptom_code);
  if (!symptom) {
    throw new Error(`Invalid symptom code: ${data.symptom_code}`);
  }

  // Validate severity range
  if (data.severity_1_5 != null && (data.severity_1_5 < 1 || data.severity_1_5 > 5)) {
    throw new Error("Severity must be between 1 and 5");
  }

  return await symptomLogModel.createSymptomLog(babyId, recordedBy, data);
}

/**
 * Get symptom log by ID
 */
export async function getSymptomLog(symptomLogId: number): Promise<SymptomLogDTO | null> {
  return await symptomLogModel.findSymptomLogById(symptomLogId);
}

/**
 * Get all symptom logs for a baby with optional filters
 */
export async function getBabySymptomLogs(
  babyId: number,
  filters?: { from?: string; to?: string; symptom_code?: string }
): Promise<SymptomLogDTO[]> {
  return await symptomLogModel.findSymptomLogsByBabyId(babyId, filters);
}

/**
 * Update symptom log
 */
export async function updateSymptomLog(
  symptomLogId: number,
  data: UpdateSymptomLogDTO
): Promise<SymptomLogDTO | null> {
  // Validate symptom code if being updated
  if (data.symptom_code) {
    const symptom = await symptomCatalogModel.findByCode(data.symptom_code);
    if (!symptom) {
      throw new Error(`Invalid symptom code: ${data.symptom_code}`);
    }
  }

  // Validate severity range if being updated
  if (data.severity_1_5 != null && (data.severity_1_5 < 1 || data.severity_1_5 > 5)) {
    throw new Error("Severity must be between 1 and 5");
  }

  return await symptomLogModel.updateSymptomLog(symptomLogId, data);
}

/**
 * Delete symptom log
 */
export async function deleteSymptomLog(symptomLogId: number): Promise<boolean> {
  return await symptomLogModel.deleteSymptomLog(symptomLogId);
}

/**
 * Check if symptom log belongs to baby
 */
export async function symptomLogBelongsToBaby(
  symptomLogId: number,
  babyId: number
): Promise<boolean> {
  return await symptomLogModel.symptomLogBelongsToBaby(symptomLogId, babyId);
}

/**
 * Assert symptom log belongs to baby, throw if not
 */
export async function assertSymptomLogBelongsToBaby(
  symptomLogId: number,
  babyId: number
): Promise<void> {
  const belongs = await symptomLogModel.symptomLogBelongsToBaby(symptomLogId, babyId);
  if (!belongs) {
    throw new Error("Symptom log not found");
  }
}
