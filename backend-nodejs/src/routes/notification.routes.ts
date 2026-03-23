import express from "express";
import * as notificationController from "../controllers/notification.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  registerTokenValidator,
  unregisterTokenValidator,
  getNotificationsValidator,
} from "../validators/notification.validator";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// POST /api/v1/notifications/register-token - Register device push token
router.post(
  "/register-token",
  registerTokenValidator,
  validate,
  notificationController.registerToken
);

// POST /api/v1/notifications/unregister-token - Unregister device push token
// Using POST instead of DELETE because the frontend apiClient.delete doesn't support request body
router.post(
  "/unregister-token",
  unregisterTokenValidator,
  validate,
  notificationController.unregisterToken
);

// GET /api/v1/notifications - Get notification history
router.get(
  "/",
  getNotificationsValidator,
  validate,
  notificationController.getNotifications
);

export default router;
