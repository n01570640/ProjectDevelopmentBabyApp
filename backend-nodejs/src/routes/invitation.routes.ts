import express from "express";
import * as invitationController from "../controllers/invitation.controller";
import * as caregiverController from "../controllers/caregiver.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission, requirePrimaryCaregiver } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createInvitationValidator,
  listInvitationsValidator,
  cancelInvitationValidator,
  getInvitationByTokenValidator,
  acceptInvitationValidator,
} from "../validators/invitation.validator";
import {
  listCaregiversValidator,
  removeCaregiverValidator,
} from "../validators/caregiver.validator";

const router = express.Router();

// ---------------------------------------------------------
// Baby-scoped invitation routes (require baby access)
// ---------------------------------------------------------

// POST /api/v1/babies/:babyId/invitations - Create invitation
router.post(
  "/babies/:babyId/invitations",
  verifyTokenMiddleware,
  createInvitationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_share"),
  invitationController.createInvitation
);

// GET /api/v1/babies/:babyId/invitations - List pending invitations
router.get(
  "/babies/:babyId/invitations",
  verifyTokenMiddleware,
  listInvitationsValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_share"),
  invitationController.listInvitations
);

// DELETE /api/v1/babies/:babyId/invitations/:inviteId - Cancel invitation
router.delete(
  "/babies/:babyId/invitations/:inviteId",
  verifyTokenMiddleware,
  cancelInvitationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_share"),
  invitationController.cancelInvitation
);

// ---------------------------------------------------------
// Token-based invitation routes
// ---------------------------------------------------------

// GET /api/v1/invitations/:token - Get invitation details (public view)
router.get(
  "/invitations/:token",
  getInvitationByTokenValidator,
  validate,
  invitationController.getInvitationByToken
);

// POST /api/v1/invitations/:token/accept - Accept invitation
router.post(
  "/invitations/:token/accept",
  verifyTokenMiddleware,
  acceptInvitationValidator,
  validate,
  invitationController.acceptInvitation
);

// ---------------------------------------------------------
// Caregiver management routes (baby-scoped)
// ---------------------------------------------------------

// GET /api/v1/babies/:babyId/caregivers - List caregivers
router.get(
  "/babies/:babyId/caregivers",
  verifyTokenMiddleware,
  listCaregiversValidator,
  validate,
  requireBabyAccess,
  caregiverController.listCaregivers
);

// DELETE /api/v1/babies/:babyId/caregivers/:userId - Remove caregiver
router.delete(
  "/babies/:babyId/caregivers/:userId",
  verifyTokenMiddleware,
  removeCaregiverValidator,
  validate,
  requireBabyAccess,
  requirePrimaryCaregiver,
  caregiverController.removeCaregiver
);

export default router;
