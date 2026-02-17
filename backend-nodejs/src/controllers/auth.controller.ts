import { Request, Response } from "express";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import * as authService from "../services/auth.service";

// Handle user registration
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, full_name, phone, invitation_token } = req.body as RegisterDTO;

    // Validate required fields
    if (!email || !password || !full_name) {
      res.status(400).json({
        success: false,
        message: "Email, password, and full name are required"
      });
      return;
    }

    // Register user via service
    const result = await authService.registerUser({
      email,
      password,
      full_name,
      phone,
      invitation_token
    });

    // Return success response with token and user data (exclude password_hash)
    const { password_hash, ...safeUser } = result.user as any;
    res.status(201).json({
      success: true,
      token: result.token,
      user: safeUser
    });
  } catch (error: any) {
    // Handle errors with appropriate status codes
    const statusCode = error.message.includes("already registered") ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
}

// Handle user login
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as LoginDTO;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
      return;
    }

    // Login user via service
    const result = await authService.loginUser({ email, password });

    // Return success response with token and user data (exclude password_hash)
    const { password_hash, ...safeUser } = result.user as any;
    res.status(200).json({
      success: true,
      token: result.token,
      user: safeUser
    });
  } catch (error: any) {
    // Invalid credentials should return 401
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
}
