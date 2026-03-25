import express from "express";
import * as symptomController from "../controllers/symptom.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createSymptomLogValidator,
  updateSymptomLogValidator,
  listSymptomLogsValidator,
  symptomLogIdValidator,
} from "../validators/symptom.validator";

const router = express.Router();

// ─── Catalog routes (authenticated, no baby-scoping) ────────────
// These are mounted at /api/v1

// GET /api/v1/symptoms - List all symptoms from catalog
router.get("/symptoms", verifyTokenMiddleware, symptomController.listSymptoms);

// GET /api/v1/symptoms/:code - Get symptom by code
router.get("/symptoms/:code", verifyTokenMiddleware, symptomController.getSymptom);

// ─── Baby-scoped symptom log routes ──────────────────────────────
// These are also mounted at /api/v1 but use /babies/:babyId prefix

// POST /api/v1/babies/:babyId/symptoms - Log a symptom
router.post(
  "/babies/:babyId/symptoms",
  verifyTokenMiddleware,
  createSymptomLogValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  symptomController.createSymptomLog
);

// GET /api/v1/babies/:babyId/symptoms - List symptom logs
router.get(
  "/babies/:babyId/symptoms",
  verifyTokenMiddleware,
  listSymptomLogsValidator,
  validate,
  requireBabyAccess,
  symptomController.listSymptomLogs
);

// GET /api/v1/babies/:babyId/symptoms/:symptomLogId - Get specific symptom log
router.get(
  "/babies/:babyId/symptoms/:symptomLogId",
  verifyTokenMiddleware,
  symptomLogIdValidator,
  validate,
  requireBabyAccess,
  symptomController.getSymptomLog
);

// PUT /api/v1/babies/:babyId/symptoms/:symptomLogId - Update symptom log
router.put(
  "/babies/:babyId/symptoms/:symptomLogId",
  verifyTokenMiddleware,
  updateSymptomLogValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  symptomController.updateSymptomLog
);

// DELETE /api/v1/babies/:babyId/symptoms/:symptomLogId - Delete symptom log
router.delete(
  "/babies/:babyId/symptoms/:symptomLogId",
  verifyTokenMiddleware,
  symptomLogIdValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  symptomController.deleteSymptomLog
);

export default router;
