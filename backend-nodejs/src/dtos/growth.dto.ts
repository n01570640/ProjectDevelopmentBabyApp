/**
 * DTOs for growth metrics
 */

// Create growth record
export interface CreateGrowthDTO {
  weight_kg?: number;
  length_cm?: number;
  head_circum_cm?: number;
  notes?: string;
  recorded_at?: string; // Optional - defaults to now
}

// Update growth record
export interface UpdateGrowthDTO {
  weight_kg?: number;
  length_cm?: number;
  head_circum_cm?: number;
  notes?: string;
  recorded_at?: string;
}

// Growth record from database
export interface GrowthDTO {
  growth_id: number;
  baby_id: number;
  recorded_at: string;
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
  recorded_by: number;
  notes: string | null;
}

// Latest growth summary (for baby card display)
export interface LatestGrowthDTO {
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
  recorded_at: string | null;
}
