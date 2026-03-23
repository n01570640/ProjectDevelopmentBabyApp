import { body } from "express-validator";
import { idParamValidator, optionalString, requiredString } from "./common.validator";

/**
 * Validators for medication routes
 */

// POST /api/v1/babies/:babyId/medications - Create medication
export const createMedicationValidator = [
  idParamValidator("babyId"),
  requiredString("name", 200),
  optionalString("dosage", 100),
  optionalString("form", 50),
  optionalString("instructions", 500),
  body("start_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("start_date must be a valid date (ISO 8601 format)"),
  body("end_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("end_date must be a valid date (ISO 8601 format)"),
  optionalString("prescribed_by", 200),
  body("end_date").custom((_value: unknown, { req }: any) => {
    if (req.body.start_date && req.body.end_date) {
      if (new Date(req.body.end_date) < new Date(req.body.start_date)) {
        throw new Error("End date cannot be before start date");
      }
    }
    return true;
  }),
];

// PUT /api/v1/babies/:babyId/medications/:medicationId - Update medication
export const updateMedicationValidator = [
  idParamValidator("babyId"),
  idParamValidator("medicationId"),
  optionalString("name", 200),
  optionalString("dosage", 100),
  optionalString("form", 50),
  optionalString("instructions", 500),
  body("start_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("start_date must be a valid date (ISO 8601 format)"),
  body("end_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("end_date must be a valid date (ISO 8601 format)"),
  optionalString("prescribed_by", 200),
  body("end_date").custom((_value: unknown, { req }: any) => {
    const startDate = req.body.start_date;
    const endDate = req.body.end_date;
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        throw new Error("End date cannot be before start date");
      }
    }
    return true;
  }),
];

// GET /api/v1/babies/:babyId/medications - List medications
export const listMedicationsValidator = [idParamValidator("babyId")];

// GET/DELETE /api/v1/babies/:babyId/medications/:medicationId
export const medicationIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("medicationId"),
];
