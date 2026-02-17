import express from "express";
import * as invitationController from "../controllers/invitation.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createInvitationValidator,
  listInvitationsValidator,
  cancelInvitationValidator,
  getInvitationByTokenValidator,
  acceptInvitationValidator,
} from "../validators/invitation.validator";

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

export default router;
