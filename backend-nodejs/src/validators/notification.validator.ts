import { body, query } from "express-validator";

/**
 * Validators for notification routes
 */

// POST /api/v1/notifications/register-token
export const registerTokenValidator = [
  body("device_token")
    .notEmpty()
    .withMessage("device_token is required")
    .isString()
    .withMessage("device_token must be a string")
    .isLength({ max: 500 })
    .withMessage("device_token must be at most 500 characters"),
  body("platform")
    .notEmpty()
    .withMessage("platform is required")
    .isIn(["android", "ios", "web"])
    .withMessage("platform must be one of: android, ios, web"),
];

// DELETE /api/v1/notifications/register-token
export const unregisterTokenValidator = [
  body("device_token")
    .notEmpty()
    .withMessage("device_token is required")
    .isString()
    .withMessage("device_token must be a string"),
];

// GET /api/v1/notifications
export const getNotificationsValidator = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];
