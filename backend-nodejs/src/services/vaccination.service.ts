import * as vaccinationModel from "../models/vaccination.model";
import {
  CreateVaccinationDTO,
  UpdateVaccinationDTO,
  VaccinationWithVaccineDTO,
} from "../dtos/vaccination.dto";
import { getVaccineById } from "../data/vaccines.data";

/**
 * Create vaccination record
 */
export async function createVaccination(
  babyId: number,
  recordedBy: number,
  data: CreateVaccinationDTO
): Promise<VaccinationWithVaccineDTO> {
  // Validate vaccine_id exists in catalog
  const vaccine = getVaccineById(data.vaccine_id);
  if (!vaccine) {
    throw new Error("Invalid vaccine ID");
  }

  return await vaccinationModel.createVaccination(babyId, recordedBy, data);
}

/**
 * Get vaccination by ID
 */
export async function getVaccination(
  vaccinationId: number
): Promise<VaccinationWithVaccineDTO | null> {
  return await vaccinationModel.findVaccinationById(vaccinationId);
}

/**
 * Get all vaccinations for a baby
 */
export async function getBabyVaccinations(
  babyId: number
): Promise<VaccinationWithVaccineDTO[]> {
  return await vaccinationModel.findVaccinationsByBabyId(babyId);
}

/**
 * Update vaccination record
 */
export async function updateVaccination(
  vaccinationId: number,
  data: UpdateVaccinationDTO
): Promise<VaccinationWithVaccineDTO | null> {
  // Validate vaccine_id if provided
  if (data.vaccine_id !== undefined) {
    const vaccine = getVaccineById(data.vaccine_id);
    if (!vaccine) {
      throw new Error("Invalid vaccine ID");
    }
  }

  return await vaccinationModel.updateVaccination(vaccinationId, data);
}

/**
 * Delete vaccination record
 */
export async function deleteVaccination(vaccinationId: number): Promise<boolean> {
  return await vaccinationModel.deleteVaccination(vaccinationId);
}

/**
 * Check if vaccination belongs to baby
 */
export async function vaccinationBelongsToBaby(
  vaccinationId: number,
  babyId: number
): Promise<boolean> {
  return await vaccinationModel.vaccinationBelongsToBaby(vaccinationId, babyId);
}

/**
 * Assert vaccination belongs to baby, throw if not
 */
export async function assertVaccinationBelongsToBaby(
  vaccinationId: number,
  babyId: number
): Promise<void> {
  const belongs = await vaccinationModel.vaccinationBelongsToBaby(vaccinationId, babyId);
  if (!belongs) {
    throw new Error("Vaccination not found");
  }
}
