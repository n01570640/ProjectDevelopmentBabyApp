import { body } from "express-validator";
import { idParamValidator, optionalDateValidator } from "./common.validator";

/**
 * Validators for growth routes
 */

// POST /api/v1/babies/:babyId/growth - Create growth record
export const createGrowthValidator = [
  idParamValidator("babyId"),
  body("weight_kg")
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage("Weight must be between 0 and 50 kg"),
  body("length_cm")
    .optional()
    .isFloat({ min: 20, max: 150 })
    .withMessage("Length must be between 20 and 150 cm"),
  body("head_circum_cm")
    .optional()
    .isFloat({ min: 20, max: 60 })
    .withMessage("Head circumference must be between 20 and 60 cm"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),
  optionalDateValidator("recorded_at"),
  body("weight_kg").custom((_value: unknown, { req }: any) => {
    if (req.body.weight_kg == null && req.body.length_cm == null && req.body.head_circum_cm == null) {
      throw new Error("At least one measurement (weight, length, or head circumference) is required");
    }
    return true;
  }),
];

// PUT /api/v1/babies/:babyId/growth/:growthId - Update growth record
export const updateGrowthValidator = [
  idParamValidator("babyId"),
  idParamValidator("growthId"),
  body("weight_kg")
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage("Weight must be between 0 and 50 kg"),
  body("length_cm")
    .optional()
    .isFloat({ min: 20, max: 150 })
    .withMessage("Length must be between 20 and 150 cm"),
  body("head_circum_cm")
    .optional()
    .isFloat({ min: 20, max: 60 })
    .withMessage("Head circumference must be between 20 and 60 cm"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must be at most 500 characters"),
  optionalDateValidator("recorded_at"),
];

// GET /api/v1/babies/:babyId/growth - List growth history
export const listGrowthValidator = [idParamValidator("babyId")];

// GET/DELETE /api/v1/babies/:babyId/growth/:growthId
export const growthIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("growthId"),
];
