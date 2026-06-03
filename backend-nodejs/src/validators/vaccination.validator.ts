import { body } from "express-validator";
import {
  idParamValidator,
  dateValidator,
  optionalDateValidator,
  optionalString,
} from "./common.validator";

/**
 * Validators for vaccination routes
 */

// POST /api/v1/babies/:babyId/vaccinations - Create vaccination
export const createVaccinationValidator = [
  idParamValidator("babyId"),
  body("vaccine_id")
    .notEmpty()
    .withMessage("vaccine_id is required")
    .isInt({ min: 1 })
    .withMessage("vaccine_id must be a positive integer")
    .toInt(),
  dateValidator("administered_on")
    .custom((value: string) => {
      if (new Date(value) > new Date()) {
        throw new Error("administered_on must not be in the future");
      }
      return true;
    }),
  optionalString("clinic", 200),
  optionalString("lot_number", 100),
  optionalString("administered_by", 200),
];

// PUT /api/v1/babies/:babyId/vaccinations/:vaccinationId - Update vaccination
export const updateVaccinationValidator = [
  idParamValidator("babyId"),
  idParamValidator("vaccinationId"),
  body("vaccine_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("vaccine_id must be a positive integer")
    .toInt(),
  optionalDateValidator("administered_on")
    .custom((value: string) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("administered_on must not be in the future");
      }
      return true;
    }),
  optionalString("clinic", 200),
  optionalString("lot_number", 100),
  optionalString("administered_by", 200),
];

// GET /api/v1/babies/:babyId/vaccinations - List vaccinations
export const listVaccinationsValidator = [idParamValidator("babyId")];

// GET/DELETE /api/v1/babies/:babyId/vaccinations/:vaccinationId
export const vaccinationIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("vaccinationId"),
];
