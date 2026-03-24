import { ROLE_PRIMARY, ROLE_SECONDARY, ROLE_PROFESSIONAL } from "../dtos/caregiver-access.dto";

/**
 * Get default permissions for a role
 */
export function getRolePermissions(roleId: number): {
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
} {
  switch (roleId) {
    case ROLE_PRIMARY:
      return {
        can_edit_health: true,
        can_edit_activities: true,
        can_share: true,
      };
    case ROLE_SECONDARY:
      return {
        can_edit_health: true,
        can_edit_activities: true,
        can_share: false,
      };
    case ROLE_PROFESSIONAL:
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
