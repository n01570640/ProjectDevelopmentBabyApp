export interface CreateBabyDTO {
  display_name: string;
  date_of_birth: string;
  sex?: string;
  blood_type?: string;
  notes?: string;
}

export interface UpdateBabyDTO {
  display_name?: string;
  date_of_birth?: string;
  sex?: string;
  blood_type?: string;
  notes?: string;
}

export interface BabyDTO {
  baby_id: number;
  display_name: string;
  date_of_birth: string;
  sex: string | null;
  blood_type: string | null;
  notes: string | null;
  created_at: string;
}

// Latest growth summary
export interface LatestGrowthSummary {
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
  recorded_at: string | null;
}

// Baby with access info for list responses
export interface BabyWithAccessDTO extends BabyDTO {
  access_role: string;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
}

// Baby with full details (including growth and primary caregiver)
export interface BabyWithDetailsDTO extends BabyWithAccessDTO {
  latest_growth: LatestGrowthSummary | null;
  primary_caregiver_name: string | null;
}
