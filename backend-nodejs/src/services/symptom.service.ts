import * as symptomLogModel from "../models/symptom-log.model";
import {
  CreateSymptomLogDTO,
  UpdateSymptomLogDTO,
  SymptomLogDTO,
} from "../dtos/symptom.dto";
import { getSymptomByCode, VALID_TRIGGER_TYPES } from "../data/symptoms.data";

/**
 * Create symptom log with business validation
 */
export async function createSymptomLog(
  babyId: number,
  recordedBy: number,
  data: CreateSymptomLogDTO
): Promise<SymptomLogDTO> {
  // Validate symptom code exists in catalog
  const symptom = getSymptomByCode(data.symptom_code);
  if (!symptom) {
    throw new Error(`Invalid symptom code: ${data.symptom_code}`);
  }

  // Validate trigger type if provided
  if (data.trigger_type && !VALID_TRIGGER_TYPES.includes(data.trigger_type)) {
    throw new Error(`Invalid trigger type: ${data.trigger_type}`);
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
  filters?: { from?: string; to?: string; symptom_code?: string; trigger_type?: string }
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
    const symptom = getSymptomByCode(data.symptom_code);
    if (!symptom) {
      throw new Error(`Invalid symptom code: ${data.symptom_code}`);
    }
  }

  // Validate trigger type if being updated
  if (data.trigger_type && !VALID_TRIGGER_TYPES.includes(data.trigger_type)) {
    throw new Error(`Invalid trigger type: ${data.trigger_type}`);
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
