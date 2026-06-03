import { body, param } from "express-validator";
import { emailValidator, idParamValidator } from "./common.validator";
import { ROLE_SECONDARY, ROLE_PROFESSIONAL } from "../dtos/caregiver-access.dto";

// Valid role IDs for invitations (cannot invite as PRIMARY_CAREGIVER)
const VALID_INVITE_ROLE_IDS = [ROLE_SECONDARY, ROLE_PROFESSIONAL];

/**
 * Validators for invitation routes
 */

// POST /api/v1/babies/:babyId/invitations - Create invitation
export const createInvitationValidator = [
  idParamValidator("babyId"),
  body("invited_email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("invited_role")
    .notEmpty()
    .withMessage("Role is required")
    .isInt()
    .withMessage("Role must be a valid role ID")
    .toInt()
    .isIn(VALID_INVITE_ROLE_IDS)
    .withMessage(
      `Role must be one of: ${VALID_INVITE_ROLE_IDS.join(", ")}`
    ),
];

// GET /api/v1/babies/:babyId/invitations - List invitations
export const listInvitationsValidator = [idParamValidator("babyId")];

// DELETE /api/v1/babies/:babyId/invitations/:inviteId - Cancel invitation
export const cancelInvitationValidator = [
  idParamValidator("babyId"),
  idParamValidator("inviteId"),
];

// GET /api/v1/invitations/:token - Get invitation by token
export const getInvitationByTokenValidator = [
  param("token")
    .notEmpty()
    .withMessage("Token is required")
    .isUUID()
    .withMessage("Invalid invitation token"),
];

// POST /api/v1/invitations/:token/accept - Accept invitation
export const acceptInvitationValidator = [
  param("token")
    .notEmpty()
    .withMessage("Token is required")
    .isUUID()
    .withMessage("Invalid invitation token"),
];
