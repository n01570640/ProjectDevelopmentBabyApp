import express from "express";
import * as guidelineController from "../controllers/guideline.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

// All routes require authentication
router.use(verifyTokenMiddleware);

// GET /api/v1/guidelines/vaccines - List all vaccines
router.get("/vaccines", guidelineController.listVaccines);

// GET /api/v1/guidelines/vaccines/schedule/:ageWeeks - Get schedule for age
router.get("/vaccines/schedule/:ageWeeks", guidelineController.getVaccineSchedule);

// GET /api/v1/guidelines/vaccines/:vaccineId - Get vaccine by ID
router.get("/vaccines/:vaccineId", guidelineController.getVaccine);

export default router;
