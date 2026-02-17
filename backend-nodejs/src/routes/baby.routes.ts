import express from "express";
import * as babyController from "../controllers/baby.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePrimaryCaregiver } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createBabyValidator,
  updateBabyValidator,
  babyIdValidator,
} from "../validators/baby.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// POST /api/v1/babies - Create baby (user becomes PRIMARY_CAREGIVER)
router.post("/", createBabyValidator, validate, babyController.createBaby);

// GET /api/v1/babies - List user's babies
router.get("/", babyController.listBabies);

// GET /api/v1/babies/:babyId - Get baby details
router.get(
  "/:babyId",
  babyIdValidator,
  validate,
  requireBabyAccess,
  babyController.getBaby
);

// PUT /api/v1/babies/:babyId - Update baby (PRIMARY_CAREGIVER only)
router.put(
  "/:babyId",
  updateBabyValidator,
  validate,
  requireBabyAccess,
  requirePrimaryCaregiver,
  babyController.updateBaby
);

// DELETE /api/v1/babies/:babyId - Primary: deletes baby entirely. Others: removes their own access.
router.delete(
  "/:babyId",
  babyIdValidator,
  validate,
  requireBabyAccess,
  babyController.deleteBaby
);

export default router;
