/**
 * DTOs for baby data analytics
 */

// Dashboard summary response
export interface BabySummaryDTO {
  baby_id: number;
  total_activities: number;
  activities_last_7_days: number;
  activity_breakdown: ActivityBreakdownItem[];
  latest_growth: {
    weight_kg: number | null;
    length_cm: number | null;
    head_circum_cm: number | null;
    recorded_at: string | null;
  } | null;
  total_growth_records: number;
  total_symptom_logs: number;
  symptoms_last_7_days: number;
  symptoms_last_30_days: number;
  active_medications: number;
  total_medications: number;
  total_vaccinations: number;
  upcoming_tasks: number;
  upcoming_reminders: number;
}

export interface ActivityBreakdownItem {
  activity_type: string;
  count: number;
}

// Graph data response
export interface BabyGraphsDTO {
  baby_id: number;
  growth_over_time: GrowthDataPoint[];
  activity_frequency: ActivityFrequencyPoint[];
  symptom_frequency: SymptomFrequencyPoint[];
}

// Growth data point for time-series chart
export interface GrowthDataPoint {
  recorded_at: string;
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
}

// Activity frequency per week
export interface ActivityFrequencyPoint {
  week_start: string;
  activity_type: string;
  count: number;
}

// Symptom frequency over time
export interface SymptomFrequencyPoint {
  week_start: string;
  symptom_code: string;
  count: number;
}
