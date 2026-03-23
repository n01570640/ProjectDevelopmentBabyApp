import * as medicationModel from "../models/medication.model";
import {
  CreateMedicationDTO,
  UpdateMedicationDTO,
  MedicationDTO,
} from "../dtos/medication.dto";

/**
 * Create medication
 */
export async function createMedication(
  babyId: number,
  data: CreateMedicationDTO
): Promise<MedicationDTO> {
  // Validate end_date is after start_date if both provided
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date cannot be before start date");
    }
  }

  return await medicationModel.createMedication(babyId, data);
}

/**
 * Get medication by ID
 */
export async function getMedication(medId: number): Promise<MedicationDTO | null> {
  return await medicationModel.findMedicationById(medId);
}

/**
 * Get all medications for a baby
 */
export async function getBabyMedications(babyId: number): Promise<MedicationDTO[]> {
  return await medicationModel.findMedicationsByBabyId(babyId);
}

/**
 * Update medication
 */
export async function updateMedication(
  medId: number,
  data: UpdateMedicationDTO
): Promise<MedicationDTO | null> {
  // Validate end_date is after start_date if both provided in update
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      throw new Error("End date cannot be before start date");
    }
  }

  // If only one date is being updated, fetch existing to cross-validate
  if ((data.start_date || data.end_date) && !(data.start_date && data.end_date)) {
    const existing = await medicationModel.findMedicationById(medId);
    if (existing) {
      const effectiveStart = data.start_date ?? existing.start_date;
      const effectiveEnd = data.end_date ?? existing.end_date;
      if (effectiveStart && effectiveEnd) {
        if (new Date(effectiveEnd) < new Date(effectiveStart)) {
          throw new Error("End date cannot be before start date");
        }
      }
    }
  }

  return await medicationModel.updateMedication(medId, data);
}

/**
 * Delete medication
 */
export async function deleteMedication(medId: number): Promise<boolean> {
  return await medicationModel.deleteMedication(medId);
}

/**
 * Check if medication belongs to baby
 */
export async function medicationBelongsToBaby(
  medId: number,
  babyId: number
): Promise<boolean> {
  return await medicationModel.medicationBelongsToBaby(medId, babyId);
}
