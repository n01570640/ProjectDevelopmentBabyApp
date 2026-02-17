import express from "express";
import * as vaccinationController from "../controllers/vaccination.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createVaccinationValidator,
  updateVaccinationValidator,
  listVaccinationsValidator,
  vaccinationIdValidator,
} from "../validators/vaccination.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/vaccinations - Record vaccination
router.post(
  "/:babyId/vaccinations",
  createVaccinationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  vaccinationController.createVaccination
);

// GET /api/v1/babies/:babyId/vaccinations - List vaccinations
router.get(
  "/:babyId/vaccinations",
  listVaccinationsValidator,
  validate,
  requireBabyAccess,
  vaccinationController.listVaccinations
);

// GET /api/v1/babies/:babyId/vaccinations/:vaccinationId - Get vaccination
router.get(
  "/:babyId/vaccinations/:vaccinationId",
  vaccinationIdValidator,
  validate,
  requireBabyAccess,
  vaccinationController.getVaccination
);

// PUT /api/v1/babies/:babyId/vaccinations/:vaccinationId - Update vaccination
router.put(
  "/:babyId/vaccinations/:vaccinationId",
  updateVaccinationValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  vaccinationController.updateVaccination
);

// DELETE /api/v1/babies/:babyId/vaccinations/:vaccinationId - Delete vaccination
router.delete(
  "/:babyId/vaccinations/:vaccinationId",
  vaccinationIdValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  vaccinationController.deleteVaccination
);

export default router;
