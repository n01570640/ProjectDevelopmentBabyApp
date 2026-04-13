import express from "express";
import multer from "multer";
import * as babyController from "../controllers/baby.controller";
import * as babyProfilePhotoController from "../controllers/baby-profile-photo.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess, requirePrimaryCaregiver } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createBabyValidator,
  updateBabyValidator,
  babyIdValidator,
} from "../validators/baby.validator";

// Memory storage — buffer is passed directly to Azure Blob upload in the service layer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

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

// GET  /api/v1/babies/:babyId/profile-photo — fetch current baby photo URL
router.get(
  "/:babyId/profile-photo",
  babyIdValidator,
  validate,
  requireBabyAccess,
  babyProfilePhotoController.getBabyProfilePhoto
);

// POST /api/v1/babies/:babyId/profile-photo — upload / replace baby photo
router.post(
  "/:babyId/profile-photo",
  babyIdValidator,
  validate,
  requireBabyAccess,
  upload.single("photo"),
  babyProfilePhotoController.uploadBabyProfilePhoto
);

export default router;
