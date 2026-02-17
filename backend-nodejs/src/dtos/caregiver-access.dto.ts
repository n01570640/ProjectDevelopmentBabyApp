/**
 * DTOs for caregiver baby access
 */

// Access roles
export enum AccessRole {
  PRIMARY_CAREGIVER = "PRIMARY_CAREGIVER",
  SECONDARY_CAREGIVER = "SECONDARY_CAREGIVER",
  PROFESSIONAL = "PROFESSIONAL",
}

// Permission types
export type Permission = "can_edit_health" | "can_edit_activities" | "can_share";

// Caregiver access record from database
export interface CaregiverAccessDTO {
  baby_id: number;
  user_id: number;
  access_role: AccessRole;
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
  access_role: AccessRole;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
  invited_at?: string;
}

// Update access permissions
export interface UpdateCaregiverAccessDTO {
  access_role?: AccessRole;
  can_edit_health?: boolean;
  can_edit_activities?: boolean;
  can_share?: boolean;
}
