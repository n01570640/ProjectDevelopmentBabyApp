import express from "express";
import * as activityController from "../controllers/activity.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePermission } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createActivityValidator,
  updateActivityValidator,
  activityIdValidator,
  listActivitiesValidator,
} from "../validators/activity.validator";

const router = express.Router();

router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/activities
router.post(
  "/:babyId/activities",
  createActivityValidator, validate,
  requireBabyAccess, requirePermission("can_edit_activities"),
  activityController.createActivity
);

// GET /api/v1/babies/:babyId/activities
router.get(
  "/:babyId/activities",
  listActivitiesValidator, validate,
  requireBabyAccess,
  activityController.listActivities
);

// GET /api/v1/babies/:babyId/activities/:activityId
router.get(
  "/:babyId/activities/:activityId",
  activityIdValidator, validate,
  requireBabyAccess,
  activityController.getActivity
);

// PUT /api/v1/babies/:babyId/activities/:activityId
router.put(
  "/:babyId/activities/:activityId",
  updateActivityValidator, validate,
  requireBabyAccess, requirePermission("can_edit_activities"),
  activityController.updateActivity
);

// DELETE /api/v1/babies/:babyId/activities/:activityId
router.delete(
  "/:babyId/activities/:activityId",
  activityIdValidator, validate,
  requireBabyAccess, requirePermission("can_edit_activities"),
  activityController.deleteActivity
);

export default router;

