/**
 * Password validation for the admin/superadmin first-login password setup
 * flow. Deliberately separate from lib/validation.ts (donor signup), since
 * the two flows have different strength rules per the API contract:
 * donor signup = 8 chars + uppercase + number; admin first-login = 6 chars
 * + number + special symbol. Do not merge these two rule sets.
 */

export const MIN_ADMIN_PASSWORD_LENGTH = 6;

export interface PasswordRequirement {
  id: "length" | "number" | "symbol";
  label: string;
  met: boolean;
}

/**
 * Returns the live requirement checklist state for a given password —
 * one entry per rule, each with whether it's currently satisfied. Drives
 * both the visual checklist and the strength meter from a single source
 * of truth, so they can never disagree with each other.
 */
export function getAdminPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: `At least ${MIN_ADMIN_PASSWORD_LENGTH} characters`,
      met: password.length >= MIN_ADMIN_PASSWORD_LENGTH,
    },
    {
      id: "number",
      label: "At least one number",
      met: /[0-9]/.test(password),
    },
    {
      id: "symbol",
      label: "At least one special symbol",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

/** True only when every requirement is met — used to enable/disable submit. */
export function isAdminPasswordValid(password: string): boolean {
  return getAdminPasswordRequirements(password).every((r) => r.met);
}

/** Validates the confirm-password field against the new password. */
export function validateConfirmAdminPassword(
  password: string,
  confirmPassword: string
): string | undefined {
  if (!confirmPassword) return "Please confirm your new password.";
  if (confirmPassword !== password) return "Passwords do not match.";
  return undefined;
}