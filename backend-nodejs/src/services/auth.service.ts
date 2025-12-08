import bcrypt from "bcryptjs";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { UserDTO, UserWithPasswordDTO } from "../dtos/user.dto";
import * as userModel from "../models/user.model";
import { generateToken } from "../utils/jwt.util";

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength (minimum 8 characters)
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Register a new user
export async function registerUser(data: RegisterDTO): Promise<{
  token: string;
  user: UserDTO;
}> {
  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new Error("Invalid email format");
  }

  // Validate password
  if (!isValidPassword(data.password)) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Check if user already exists
  const existingUser = await userModel.findUserByEmail(data.email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user in database
  const user = await userModel.createUser(
    data.email,
    hashedPassword,
    data.full_name,
    data.phone || null
  );

  // Generate JWT token
  const token = generateToken({
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name
  });

  return { token, user };
}

// Login user with email and password
export async function loginUser(data: LoginDTO): Promise<{
  token: string;
  user: UserDTO;
}> {
  // Find user by email
  const user = await userModel.findUserByEmail(data.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare provided password with stored hash (convert Buffer to string)
  const passwordHashString = typeof user.password_hash === 'string'
    ? user.password_hash
    : user.password_hash.toString('utf8');

  const isPasswordValid = await bcrypt.compare(data.password, passwordHashString);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken({
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name
  });

  return { token, user };
}
