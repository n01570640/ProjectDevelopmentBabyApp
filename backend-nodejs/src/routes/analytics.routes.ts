import express from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  babySummaryValidator,
  babyGraphsValidator,
} from "../validators/analytics.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/v1/analytics/baby/:babyId/summary - Dashboard summary
router.get(
  "/baby/:babyId/summary",
  babySummaryValidator,
  validate,
  requireBabyAccess,
  analyticsController.getBabySummary
);

// GET /api/v1/analytics/baby/:babyId/graphs - Graph data
router.get(
  "/baby/:babyId/graphs",
  babyGraphsValidator,
  validate,
  requireBabyAccess,
  analyticsController.getBabyGraphs
);

export default router;
