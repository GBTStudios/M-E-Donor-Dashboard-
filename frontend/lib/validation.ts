/**
 * Validation logic for authentication forms (Sign Up, Login, Forgot Password).
 *
 * Deliberately framework-independent: no React, no DOM. Every function here
 * takes plain values and returns plain results, so it can be unit tested in
 * isolation and reused across every auth screen without duplicating rules.
 *
 * IMPORTANT: these are client-side checks for UX only. The backend must
 * independently re-validate everything here — never trust client input.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimum password length enforced across the whole app. */
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordStrengthLabel = "Too weak" | "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrength {
  /** 0 (empty/too weak) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel;
  /** Brand-consistent hex color for the strength meter UI. */
  color: string;
}

/**
 * Checks whether a string is a plausible email address.
 * Intentionally permissive — full RFC 5322 validation is the backend's job
 * (and even then, the only real proof an email is valid is sending to it).
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/**
 * Scores password strength on a 0–4 scale based on length and character
 * variety. Used to drive the live strength meter in the UI.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const strengthTable: { label: PasswordStrengthLabel; color: string }[] = [
    { label: "Too weak", color: "#E4DFD1" },
    { label: "Weak", color: "#B3402A" },
    { label: "Fair", color: "#B08900" },
    { label: "Good", color: "#1C5E59" },
    { label: "Strong", color: "#1C5E59" },
  ];

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  const clamped = Math.min(score, 4) as PasswordStrength["score"];
  return { score: clamped, ...strengthTable[clamped] };
}

export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type SignUpFieldErrors = Partial<Record<keyof SignUpFormValues, string>>;

/**
 * Validates a single Sign Up field in the context of the full form
 * (needed because confirmPassword's validity depends on password).
 * Returns undefined when the field is valid.
 */
export function validateSignUpField(
  field: keyof SignUpFormValues,
  values: SignUpFormValues
): string | undefined {
  switch (field) {
    case "name":
      if (!values.name.trim()) return "Full name is required.";
      return undefined;

    case "email":
      if (!values.email.trim()) return "Email is required.";
      if (!isValidEmail(values.email)) return "Enter a valid email address.";
      return undefined;

    case "password":
      if (!values.password) return "Password is required.";
      if (values.password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (!/[A-Z]/.test(values.password)) {
        return "Password must contain at least one uppercase letter.";
      }
      if (!/[0-9]/.test(values.password)) {
        return "Password must contain at least one number.";
      }
      return undefined;

    case "confirmPassword":
      if (!values.confirmPassword) return "Please confirm your password.";
      if (values.confirmPassword !== values.password) return "Passwords do not match.";
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Validates every field in a Sign Up form at once (e.g. on submit).
 * Returns an errors object containing only the fields that failed —
 * an empty object means the form is fully valid.
 */
export function validateSignUpForm(values: SignUpFormValues): SignUpFieldErrors {
  const fields: (keyof SignUpFormValues)[] = ["name", "email", "password", "confirmPassword"];
  const errors: SignUpFieldErrors = {};

  for (const field of fields) {
    const error = validateSignUpField(field, values);
    if (error) errors[field] = error;
  }

  return errors;
}

/** True if a validated Sign Up errors object represents a fully valid form. */
export function isSignUpFormValid(errors: SignUpFieldErrors): boolean {
  return Object.keys(errors).length === 0;
}