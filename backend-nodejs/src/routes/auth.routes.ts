import express from "express";
import * as authController from "../controllers/auth.controller";

const router = express.Router();

// POST /api/v1/auth/register - Register a new user
router.post("/register", authController.registerUser);

// POST /api/v1/auth/login - Login user
router.post("/login", authController.loginUser);

export default router;
