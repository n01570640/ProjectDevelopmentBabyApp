import express from "express";
import multer from "multer";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import * as profilePhotoController from "../controllers/profile-photo.controller";

const router = express.Router();

// Use memory storage so the file buffer is available on req.file.buffer
// We handle the upload to Azure ourselves in the service layer.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// All routes require a valid JWT
router.use(verifyTokenMiddleware);

// GET  /api/v1/users/me/profile-photo  — fetch current photo URL
router.get("/me/profile-photo", profilePhotoController.getProfilePhoto);

// POST /api/v1/users/me/profile-photo  — upload / replace photo
router.post(
  "/me/profile-photo",
  upload.single("photo"),
  profilePhotoController.uploadProfilePhoto
);

export default router;

