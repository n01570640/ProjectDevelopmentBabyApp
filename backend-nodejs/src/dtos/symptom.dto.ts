/**
 * DTOs for symptom tracking
 */

// Symptom catalog entry (reference data)
export interface SymptomCatalogDTO {
  symptom_code: string;
  symptom_name: string;
  description: string;
}

// Symptom log from database
export interface SymptomLogDTO {
  symptom_log_id: number;
  baby_id: number;
  symptom_code: string;
  started_at: string;
  severity_1_5: number | null;
  trigger_type: string | null;
  trigger_note: string | null;
  associated_med_id: number | null;
  notes: string | null;
  recorded_by: number;
}

// Create symptom log
export interface CreateSymptomLogDTO {
  symptom_code: string;
  started_at?: string;
  severity_1_5?: number;
  trigger_type?: string;
  trigger_note?: string;
  associated_med_id?: number;
  notes?: string;
}

// Update symptom log
export interface UpdateSymptomLogDTO {
  symptom_code?: string;
  started_at?: string;
  severity_1_5?: number;
  trigger_type?: string;
  trigger_note?: string;
  associated_med_id?: number;
  notes?: string;
}
