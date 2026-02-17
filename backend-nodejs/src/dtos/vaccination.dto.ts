/**
 * DTOs for vaccination records
 */

// Create vaccination record
export interface CreateVaccinationDTO {
  vaccine_id: number;
  administered_on: string;
  clinic?: string;
  lot_number?: string;
  administered_by?: string;
}

// Update vaccination record
export interface UpdateVaccinationDTO {
  vaccine_id?: number;
  administered_on?: string;
  clinic?: string;
  lot_number?: string;
  administered_by?: string;
}

// Vaccination record from database
export interface VaccinationDTO {
  baby_vax_id: number;
  baby_id: number;
  vaccine_id: number;
  administered_on: string;
  clinic: string | null;
  lot_number: string | null;
  administered_by: string | null;
  recorded_by: number;
}

// Vaccination with vaccine details for API response
export interface VaccinationWithVaccineDTO extends VaccinationDTO {
  vaccine_name: string;
  schedule_weeks: number;
}

// Response for listing vaccinations
export interface VaccinationListResponseDTO {
  vaccinations: VaccinationWithVaccineDTO[];
  total: number;
}
