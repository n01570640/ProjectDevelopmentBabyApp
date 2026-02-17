import bcrypt from "bcryptjs";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { UserDTO, UserWithPasswordDTO } from "../dtos/user.dto";
import * as userModel from "../models/user.model";
import * as invitationModel from "../models/invitation.model";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import { AccessRole } from "../dtos/caregiver-access.dto";
import { isExpired } from "../utils/token.util";
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

  // If an invitation token was provided, verify and auto-accept it
  if (data.invitation_token) {
    await acceptInvitationByToken(user.user_id, data.email, data.invitation_token);
  }

  // Generate JWT token
  const token = generateToken({
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name
  });

  return { token, user };
}

// Accept a specific invitation by token during registration
async function acceptInvitationByToken(
  userId: number,
  email: string,
  invitationToken: string
): Promise<void> {
  try {
    const invite = await invitationModel.findInvitationByToken(invitationToken);

    if (!invite) {
      console.warn("Invitation token not found during registration");
      return;
    }

    if (invite.accepted_at) {
      console.warn("Invitation already accepted");
      return;
    }

    if (isExpired(invite.expires_at)) {
      console.warn("Invitation has expired");
      return;
    }

    // Verify the email matches the invitation
    if (invite.invited_email.toLowerCase() !== email.toLowerCase()) {
      console.warn("Registration email does not match invitation email");
      return;
    }

    const permissions = getRolePermissions(invite.invited_role as AccessRole);

    await caregiverAccessModel.createCaregiverAccess({
      baby_id: invite.baby_id,
      user_id: userId,
      access_role: invite.invited_role as AccessRole,
      ...permissions,
      invited_at: invite.created_at,
    });

    await invitationModel.acceptInvitation(invite.invite_id, userId);
    console.log(`Auto-accepted invitation ${invite.invite_id} for user ${userId}`);
  } catch (error) {
    // Log but don't fail registration if auto-accept fails
    console.error("Error accepting invitation during registration:", error);
  }
}

// Get default permissions for a role
function getRolePermissions(role: AccessRole): {
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
} {
  switch (role) {
    case AccessRole.SECONDARY_CAREGIVER:
      return { can_edit_health: true, can_edit_activities: true, can_share: false };
    case AccessRole.PROFESSIONAL:
      return { can_edit_health: true, can_edit_activities: false, can_share: false };
    default:
      return { can_edit_health: false, can_edit_activities: false, can_share: false };
  }
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
