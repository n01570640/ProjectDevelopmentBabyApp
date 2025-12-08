import { UserDTO } from "./user.dto";

// Data for user registration
export interface RegisterDTO {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

// Data for user login
export interface LoginDTO {
  email: string;
  password: string;
}

// JWT token response format
export interface AuthResponseDTO {
  success: boolean;
  token: string;
  user: UserDTO;
}

// Error response format
export interface AuthErrorDTO {
  success: boolean;
  message: string;
}
