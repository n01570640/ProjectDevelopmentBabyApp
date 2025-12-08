import jwt from "jsonwebtoken";

// Generate a JWT token with user data
export function generateToken(payload: any): string {
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "24h" // Token expires in 24 hours
  });
  return token;
}

// Verify and decode a JWT token
export function verifyToken(token: string): any {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Extract token from Authorization header (Bearer scheme)
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) return null;

  // Expected format: "Bearer token_value"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
