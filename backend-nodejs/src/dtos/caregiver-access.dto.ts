/**
 * DTOs for caregiver baby access
 */

// Role ID constants (match roles table in DB)
export const ROLE_PRIMARY = 1;
export const ROLE_SECONDARY = 2;
export const ROLE_PROFESSIONAL = 3;

// Permission types
export type Permission = "can_edit_health" | "can_edit_activities" | "can_share";

// Caregiver access record from database
export interface CaregiverAccessDTO {
  baby_id: number;
  user_id: number;
  access_role: number;
  role_name: string;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
  invited_at: string | null;
  accepted_at: string | null;
}

// Create access record (when creating baby or accepting invite)
export interface CreateCaregiverAccessDTO {
  baby_id: number;
  user_id: number;
  access_role: number;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
  invited_at?: string;
}

// Caregiver access with user details (for listing caregivers)
export interface CaregiverWithUserDTO {
  baby_id: number;
  user_id: number;
  access_role: number;
  role_name: string;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
  full_name: string;
  email: string;
}

// Update access permissions
export interface UpdateCaregiverAccessDTO {
  access_role?: number;
  can_edit_health?: boolean;
  can_edit_activities?: boolean;
  can_share?: boolean;
}
