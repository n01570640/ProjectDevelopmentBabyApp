import { body, param, query } from "express-validator";

/**
 * Common reusable validators
 */

// Email validator
export const emailValidator = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required")
  .isEmail()
  .withMessage("Invalid email format")
  .normalizeEmail();

// Password validator (min 8 chars)
export const passwordValidator = body("password")
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 8, max: 128 })
  .withMessage("Password must be between 8 and 128 characters");

// Required string validator factory
export const requiredString = (field: string, maxLength: number = 200) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ max: maxLength })
    .withMessage(`${field} must be at most ${maxLength} characters`);

// Optional string validator factory
export const optionalString = (field: string, maxLength: number = 200) =>
  body(field)
    .optional({ nullable: true })
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${field} must be at most ${maxLength} characters`);

// Date validator (ISO format)
export const dateValidator = (field: string) =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isISO8601()
    .withMessage(`${field} must be a valid date (ISO 8601 format)`);

// Optional date validator
export const optionalDateValidator = (field: string) =>
  body(field)
    .optional({ nullable: true })
    .isISO8601()
    .withMessage(`${field} must be a valid date (ISO 8601 format)`);

// ID param validator (for route params like :babyId)
export const idParamValidator = (paramName: string) =>
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
    .toInt();

// Pagination validators
export const paginationValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];

// Enum validator factory
export const enumValidator = (field: string, validValues: string[]) =>
  body(field)
    .optional({ nullable: true })
    .isIn(validValues)
    .withMessage(`${field} must be one of: ${validValues.join(", ")}`);

// Required enum validator factory
export const requiredEnumValidator = (field: string, validValues: string[]) =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isIn(validValues)
    .withMessage(`${field} must be one of: ${validValues.join(", ")}`);
