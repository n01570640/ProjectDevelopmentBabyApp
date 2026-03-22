import { AccessRole } from "../dtos/caregiver-access.dto";

/**
 * Get default permissions for a role
 */
export function getRolePermissions(role: AccessRole): {
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
} {
  switch (role) {
    case AccessRole.SECONDARY_CAREGIVER:
      return {
        can_edit_health: true,
        can_edit_activities: true,
        can_share: false,
      };
    case AccessRole.PROFESSIONAL:
      return {
        can_edit_health: true,
        can_edit_activities: false,
        can_share: false,
      };
    default:
      return {
        can_edit_health: false,
        can_edit_activities: false,
        can_share: false,
      };
  }
}
