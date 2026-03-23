import { AccessRole } from "./caregiver-access.dto";

/**
 * DTOs for invitation system
 */

// Valid roles for invitations (cannot invite as PRIMARY_CAREGIVER)
export type InviteRole = Exclude<AccessRole, AccessRole.PRIMARY_CAREGIVER>;

// Create invitation request
export interface CreateInvitationDTO {
  invited_email: string;
  invited_role: InviteRole;
}

// Invitation record from database
export interface InvitationDTO {
  invite_id: number;
  baby_id: number;
  invited_email: string;
  invited_role: string;
  inviter_user_id: number;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_user_id: number | null;
  accepted_at: string | null;
  // Joined data
  baby_name?: string;
  inviter_name?: string;
}

// Invitation response for API
export interface InvitationResponseDTO {
  invite_id: number;
  baby_id: number;
  invited_email: string;
  invited_role: string;
  token: string;
  expires_at: string;
  is_expired: boolean;
  is_accepted: boolean;
  accepted_at: string | null;
}

// Public invitation details (for accepting)
export interface InvitationDetailsDTO {
  baby_name: string;
  inviter_name: string;
  invited_role: string;
  expires_at: string;
  is_expired: boolean;
}
