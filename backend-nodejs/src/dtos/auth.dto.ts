// Data for user registration
export interface RegisterDTO {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  invitation_token?: string;
}

// Data for user login
export interface LoginDTO {
  email: string;
  password: string;
}

// Error response format
export interface AuthErrorDTO {
  success: boolean;
  message: string;
}
