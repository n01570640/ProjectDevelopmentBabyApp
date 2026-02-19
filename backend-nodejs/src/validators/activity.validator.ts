import { body } from "express-validator";
import { idParamValidator, optionalDateValidator, dateValidator } from "./common.validator";

const ACTIVITY_TYPES = ["feeding", "sleep", "diaper", "play", "bath", "other"];

export const createActivityValidator = [
  idParamValidator("babyId"),
  body("activity_type")
    .trim()
    .notEmpty().withMessage("activity_type is required")
    .isIn(ACTIVITY_TYPES).withMessage(`activity_type must be one of: ${ACTIVITY_TYPES.join(", ")}`),
  dateValidator("start_time"),
  optionalDateValidator("end_time"),
  body("amount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("amount must be a positive number"),
  body("unit").optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage("unit must be at most 20 characters"),
  body("diaper_type").optional({ nullable: true }).trim().isIn(["wet", "dirty", "mixed", "dry", ""]).withMessage("Invalid diaper_type"),
  body("side").optional({ nullable: true }).trim().isIn(["left", "right", "both", ""]).withMessage("side must be left, right, or both"),
  body("quality").optional({ nullable: true }).isInt({ min: 1, max: 5 }).withMessage("quality must be between 1 and 5"),
  body("notes").optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage("notes must be at most 500 characters"),
];

export const updateActivityValidator = [
  idParamValidator("babyId"),
  idParamValidator("activityId"),
  body("activity_type").optional().trim().isIn(ACTIVITY_TYPES).withMessage(`activity_type must be one of: ${ACTIVITY_TYPES.join(", ")}`),
  optionalDateValidator("start_time"),
  optionalDateValidator("end_time"),
  body("amount").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("amount must be a positive number"),
  body("unit").optional({ nullable: true }).trim().isLength({ max: 20 }),
  body("diaper_type").optional({ nullable: true }).trim(),
  body("side").optional({ nullable: true }).trim().isIn(["left", "right", "both", ""]),
  body("quality").optional({ nullable: true }).isInt({ min: 1, max: 5 }),
  body("notes").optional({ nullable: true }).trim().isLength({ max: 500 }),
];

export const activityIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("activityId"),
];

export const listActivitiesValidator = [idParamValidator("babyId")];

