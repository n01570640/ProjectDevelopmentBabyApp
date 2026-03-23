import express from "express";
import { param } from "express-validator";
import * as guidelineController from "../controllers/guideline.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// Param validators
const vaccineIdValidator = [
  param("vaccineId").isInt({ min: 1 }).withMessage("vaccineId must be a positive integer").toInt(),
];

const ageWeeksValidator = [
  param("ageWeeks").isInt({ min: 0 }).withMessage("ageWeeks must be a non-negative integer").toInt(),
];

// GET /api/v1/guidelines/vaccines - List all vaccines
router.get("/vaccines", guidelineController.listVaccines);

// GET /api/v1/guidelines/vaccines/schedule/:ageWeeks - Get schedule for age
router.get("/vaccines/schedule/:ageWeeks", ageWeeksValidator, validate, guidelineController.getVaccineSchedule);

// GET /api/v1/guidelines/vaccines/:vaccineId - Get vaccine by ID
router.get("/vaccines/:vaccineId", vaccineIdValidator, validate, guidelineController.getVaccine);

export default router;
