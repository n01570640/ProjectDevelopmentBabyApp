import { body } from "express-validator";
import {
  emailValidator,
  passwordValidator,
  requiredString,
  optionalString,
} from "./common.validator";

/**
 * Validators for auth routes
 */

// POST /api/v1/auth/register
export const registerValidator = [
  emailValidator,
  passwordValidator,
  requiredString("full_name", 200)
    .matches(/^[\p{L}\p{M}\s'.\-]+$/u)
    .withMessage("Full name contains invalid characters"),
  optionalString("phone", 40),
  body("invitation_token")
    .optional()
    .isUUID()
    .withMessage("Invalid invitation token"),
];

// POST /api/v1/auth/login
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];
