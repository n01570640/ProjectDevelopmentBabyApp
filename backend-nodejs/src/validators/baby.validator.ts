import { body } from "express-validator";
import {
  requiredString,
  optionalString,
  dateValidator,
  optionalDateValidator,
  idParamValidator,
  enumValidator,
} from "./common.validator";

// Valid values for sex and blood_type
const VALID_SEX_VALUES = ["male", "female", "other"];
const VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Validators for baby routes
 */

// POST /api/v1/babies - Create baby
export const createBabyValidator = [
  requiredString("display_name", 200),
  dateValidator("date_of_birth")
    .custom((value: string) => {
      if (new Date(value) > new Date()) {
        throw new Error("date_of_birth must not be in the future");
      }
      return true;
    }),
  enumValidator("sex", VALID_SEX_VALUES),
  enumValidator("blood_type", VALID_BLOOD_TYPES),
  optionalString("notes", 1000),
];

// PUT /api/v1/babies/:babyId - Update baby
export const updateBabyValidator = [
  idParamValidator("babyId"),
  body("display_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("display_name cannot be empty if provided")
    .isLength({ max: 200 })
    .withMessage("display_name must be at most 200 characters"),
  optionalDateValidator("date_of_birth")
    .custom((value: string) => {
      if (value && new Date(value) > new Date()) {
        throw new Error("date_of_birth must not be in the future");
      }
      return true;
    }),
  enumValidator("sex", VALID_SEX_VALUES),
  enumValidator("blood_type", VALID_BLOOD_TYPES),
  optionalString("notes", 1000),
];

// GET/DELETE /api/v1/babies/:babyId - Single baby operations
export const babyIdValidator = [idParamValidator("babyId")];
