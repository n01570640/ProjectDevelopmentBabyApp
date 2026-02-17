import express from "express";
import * as authController from "../controllers/auth.controller";
import { registerValidator, loginValidator } from "../validators/auth.validator";
import { validate } from "../middleware/validation.middleware";

const router = express.Router();

// POST /api/v1/auth/register - Register a new user
router.post("/register", registerValidator, validate, authController.registerUser);

// POST /api/v1/auth/login - Login user
router.post("/login", loginValidator, validate, authController.loginUser);

export default router;
