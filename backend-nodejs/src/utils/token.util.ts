import crypto from "crypto";

/**
 * Generate a secure random token (UUID v4 format)
 */
export function generateSecureToken(): string {
  return crypto.randomUUID();
}

/**
 * Generate expiration date (days from now)
 */
export function generateExpirationDate(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if a date has passed (expired)
 */
export function isExpired(expirationDate: Date | string): boolean {
  const expiry = new Date(expirationDate);
  if (isNaN(expiry.getTime())) return true;
  return expiry < new Date();
}
