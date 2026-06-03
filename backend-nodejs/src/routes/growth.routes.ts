import express from "express";
import * as growthController from "../controllers/growth.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createGrowthValidator,
  updateGrowthValidator,
  listGrowthValidator,
  growthIdValidator,
} from "../validators/growth.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/growth - Record growth metrics
router.post(
  "/:babyId/growth",
  createGrowthValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  growthController.createGrowth
);

// GET /api/v1/babies/:babyId/growth - List growth history
router.get(
  "/:babyId/growth",
  listGrowthValidator,
  validate,
  requireBabyAccess,
  growthController.listGrowth
);

// GET /api/v1/babies/:babyId/growth/latest - Get latest growth
router.get(
  "/:babyId/growth/latest",
  listGrowthValidator,
  validate,
  requireBabyAccess,
  growthController.getLatestGrowth
);

// GET /api/v1/babies/:babyId/growth/:growthId - Get specific growth record
router.get(
  "/:babyId/growth/:growthId",
  growthIdValidator,
  validate,
  requireBabyAccess,
  growthController.getGrowth
);

// PUT /api/v1/babies/:babyId/growth/:growthId - Update growth record
router.put(
  "/:babyId/growth/:growthId",
  updateGrowthValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  growthController.updateGrowth
);

// DELETE /api/v1/babies/:babyId/growth/:growthId - Delete growth record
router.delete(
  "/:babyId/growth/:growthId",
  growthIdValidator,
  validate,
  requireBabyAccess,
  requirePermission("can_edit_health"),
  growthController.deleteGrowth
);

export default router;
