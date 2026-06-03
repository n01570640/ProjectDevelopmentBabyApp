export interface CreateUserDTO {
  email: string;
  password: string;   // plain password, backend will hash it
  full_name: string;
  phone?: string;
}

export interface UserDTO {
  user_id: number;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  is_active: boolean;
}

// Internal use only - includes password_hash for authentication
// Never send this to frontend/client
export interface UserWithPasswordDTO extends UserDTO {
  password_hash: Buffer | string;
}
