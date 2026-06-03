import { body } from "express-validator";
import { idParamValidator, dateValidator, optionalDateValidator } from "./common.validator";

export const createReminderValidator = [
  idParamValidator("babyId"),
  body("title").trim().notEmpty().withMessage("title is required").isLength({ max: 200 }).withMessage("title must be at most 200 characters"),
  body("body").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("body must be at most 500 characters"),
  dateValidator("due_at"),
  body("rrule").optional({ nullable: true }).trim().isLength({ max: 400 }).withMessage("rrule must be at most 400 characters"),
];

export const updateReminderValidator = [
  idParamValidator("babyId"),
  idParamValidator("reminderId"),
  body("title").optional().trim().notEmpty().isLength({ max: 200 }),
  body("body").optional({ nullable: true }).trim().isLength({ max: 500 }),
  optionalDateValidator("due_at"),
  body("rrule").optional({ nullable: true }).trim().isLength({ max: 400 }),
  body("is_active").optional().isBoolean().withMessage("is_active must be a boolean"),
];

export const reminderIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("reminderId"),
];

export const listRemindersValidator = [idParamValidator("babyId")];

