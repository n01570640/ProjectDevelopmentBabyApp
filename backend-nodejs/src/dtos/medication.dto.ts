/**
 * DTOs for medications
 */

// Medication record from database
export interface MedicationDTO {
  med_id: number;
  baby_id: number;
  name: string;
  dosage: string | null;
  form: string | null;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  prescribed_by: string | null;
}

// Create medication
export interface CreateMedicationDTO {
  name: string;
  dosage?: string;
  form?: string;
  instructions?: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
}

// Update medication
export interface UpdateMedicationDTO {
  name?: string;
  dosage?: string;
  form?: string;
  instructions?: string;
  start_date?: string;
  end_date?: string;
  prescribed_by?: string;
}
