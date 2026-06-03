import express from "express";
import * as reminderController from "../controllers/reminder.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createReminderValidator,
  updateReminderValidator,
  reminderIdValidator,
  listRemindersValidator,
} from "../validators/reminder.validator";

const router = express.Router();

router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/reminders
router.post(
  "/:babyId/reminders",
  createReminderValidator, validate,
  requireBabyAccess,
  reminderController.createReminder
);

// GET /api/v1/babies/:babyId/reminders
router.get(
  "/:babyId/reminders",
  listRemindersValidator, validate,
  requireBabyAccess,
  reminderController.listReminders
);

// GET /api/v1/babies/:babyId/reminders/:reminderId
router.get(
  "/:babyId/reminders/:reminderId",
  reminderIdValidator, validate,
  requireBabyAccess,
  reminderController.getReminder
);

// PUT /api/v1/babies/:babyId/reminders/:reminderId
router.put(
  "/:babyId/reminders/:reminderId",
  updateReminderValidator, validate,
  requireBabyAccess,
  reminderController.updateReminder
);

// DELETE /api/v1/babies/:babyId/reminders/:reminderId
router.delete(
  "/:babyId/reminders/:reminderId",
  reminderIdValidator, validate,
  requireBabyAccess,
  reminderController.deleteReminder
);

export default router;

