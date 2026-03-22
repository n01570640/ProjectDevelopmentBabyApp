import bcrypt from "bcryptjs";
import { RegisterDTO, LoginDTO } from "../dtos/auth.dto";
import { UserDTO, UserWithPasswordDTO } from "../dtos/user.dto";
import * as userModel from "../models/user.model";
import * as invitationModel from "../models/invitation.model";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import { AccessRole } from "../dtos/caregiver-access.dto";
import { isExpired } from "../utils/token.util";
import { getRolePermissions } from "../utils/role-permissions.util";
import { generateToken } from "../utils/jwt.util";
import sqlLib from "mssql";
import { getDb } from "../db";

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

  // If invitation token is provided, wrap everything in a transaction
  if (data.invitation_token) {
    const db = await getDb();
    const transaction = new sqlLib.Transaction(db);

    try {
      await transaction.begin();

      const user = await userModel.createUser(
        data.email,
        hashedPassword,
        data.full_name,
        data.phone || null,
        new sqlLib.Request(transaction)
      );

      await acceptInvitationByToken(
        user.user_id,
        data.email,
        data.invitation_token,
        transaction
      );

      await transaction.commit();

      const token = generateToken({
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name
      });

      return { token, user };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // No invitation token — simple registration
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

// Accept a specific invitation by token during registration
async function acceptInvitationByToken(
  userId: number,
  email: string,
  invitationToken: string,
  transaction?: sqlLib.Transaction
): Promise<void> {
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

  await caregiverAccessModel.createCaregiverAccess(
    {
      baby_id: invite.baby_id,
      user_id: userId,
      access_role: invite.invited_role as AccessRole,
      ...permissions,
      invited_at: invite.created_at,
    },
    transaction ? new sqlLib.Request(transaction) : undefined
  );

  await invitationModel.acceptInvitation(
    invite.invite_id,
    userId,
    transaction ? new sqlLib.Request(transaction) : undefined
  );
  console.log(`Auto-accepted invitation ${invite.invite_id} for user ${userId}`);
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
