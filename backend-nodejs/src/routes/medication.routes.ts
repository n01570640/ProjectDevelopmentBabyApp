import express from "express";
import * as medicationController from "../controllers/medication.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createMedicationValidator,
  updateMedicationValidator,
  listMedicationsValidator,
  medicationIdValidator,
} from "../validators/medication.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/medications - Add medication
router.post(
  "/:babyId/medications",
  createMedicationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  medicationController.createMedication
);

// GET /api/v1/babies/:babyId/medications - List medications
router.get(
  "/:babyId/medications",
  listMedicationsValidator,
  validate,
  requireBabyAccess,
  medicationController.listMedications
);

// GET /api/v1/babies/:babyId/medications/:medicationId - Get specific medication
router.get(
  "/:babyId/medications/:medicationId",
  medicationIdValidator,
  validate,
  requireBabyAccess,
  medicationController.getMedication
);

// PUT /api/v1/babies/:babyId/medications/:medicationId - Update medication
router.put(
  "/:babyId/medications/:medicationId",
  updateMedicationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  medicationController.updateMedication
);

// DELETE /api/v1/babies/:babyId/medications/:medicationId - Delete medication
router.delete(
  "/:babyId/medications/:medicationId",
  medicationIdValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  medicationController.deleteMedication
);

export default router;
