import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller";
import { registerValidator, loginValidator } from "../validators/auth.validator";
import { validate } from "../middleware/validation.middleware";

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, message: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/auth/register - Register a new user
router.post("/register", registerLimiter, registerValidator, validate, authController.registerUser);

// POST /api/v1/auth/login - Login user
router.post("/login", loginLimiter, loginValidator, validate, authController.loginUser);

export default router;
