import { body, query } from "express-validator";
import { idParamValidator, optionalDateValidator, optionalString } from "./common.validator";
import { VALID_SYMPTOM_CODES, VALID_TRIGGER_TYPES } from "../data/symptoms.data";

/**
 * Validators for symptom routes
 */

// POST /api/v1/babies/:babyId/symptoms - Create symptom log
export const createSymptomLogValidator = [
  idParamValidator("babyId"),
  body("symptom_code")
    .notEmpty()
    .withMessage("symptom_code is required")
    .isIn(VALID_SYMPTOM_CODES)
    .withMessage(`symptom_code must be one of: ${VALID_SYMPTOM_CODES.join(", ")}`),
  body("severity_1_5")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Severity must be an integer between 1 and 5"),
  body("trigger_type")
    .optional({ nullable: true })
    .isIn(VALID_TRIGGER_TYPES)
    .withMessage(`trigger_type must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`),
  optionalString("trigger_note", 300),
  body("associated_med_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("associated_med_id must be a positive integer"),
  optionalString("notes", 1000),
  optionalDateValidator("started_at"),
];

// PUT /api/v1/babies/:babyId/symptoms/:symptomLogId - Update symptom log
export const updateSymptomLogValidator = [
  idParamValidator("babyId"),
  idParamValidator("symptomLogId"),
  body("symptom_code")
    .optional()
    .isIn(VALID_SYMPTOM_CODES)
    .withMessage(`symptom_code must be one of: ${VALID_SYMPTOM_CODES.join(", ")}`),
  body("severity_1_5")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Severity must be an integer between 1 and 5"),
  body("trigger_type")
    .optional({ nullable: true })
    .isIn(VALID_TRIGGER_TYPES)
    .withMessage(`trigger_type must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`),
  optionalString("trigger_note", 300),
  body("associated_med_id")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("associated_med_id must be a positive integer"),
  optionalString("notes", 1000),
  optionalDateValidator("started_at"),
];

// GET /api/v1/babies/:babyId/symptoms - List symptom logs (with optional filters)
export const listSymptomLogsValidator = [
  idParamValidator("babyId"),
  query("from")
    .optional()
    .isISO8601()
    .withMessage("from must be a valid date (ISO 8601 format)"),
  query("to")
    .optional()
    .isISO8601()
    .withMessage("to must be a valid date (ISO 8601 format)"),
  query("symptom_code")
    .optional()
    .isIn(VALID_SYMPTOM_CODES)
    .withMessage(`symptom_code must be one of: ${VALID_SYMPTOM_CODES.join(", ")}`),
  query("trigger_type")
    .optional()
    .isIn(VALID_TRIGGER_TYPES)
    .withMessage(`trigger_type must be one of: ${VALID_TRIGGER_TYPES.join(", ")}`),
];

// GET/DELETE /api/v1/babies/:babyId/symptoms/:symptomLogId
export const symptomLogIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("symptomLogId"),
];
