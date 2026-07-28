/**
 * Typed API client for auth endpoints.
 *
 * Deliberately thin: one function per endpoint, each returning a discriminated
 * union so callers can switch on `success` and get full type narrowing without
 * a try/catch around JSON parsing scattered through components.
 */

import type { SignUpFormValues } from "./validation";

/** Base URL for API calls. Empty string means "same origin" (Next.js API routes). */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface SignUpRequestBody {
  name: string;
  email: string;
  password: string;
}

export interface SignUpSuccessResponse {
  success: true;
  userId: string;
  email: string;
}

export interface SignUpErrorResponse {
  success: false;
  message: string;
  field?: keyof SignUpRequestBody;
}

export type SignUpResponse = SignUpSuccessResponse | SignUpErrorResponse;

/**
 * Calls POST /api/auth/signup with the given form values.
 *
 * Never throws for expected failure cases (duplicate email, validation errors,
 * etc.) — those come back as a `{ success: false, message }` object per the
 * agreed contract. This only throws for genuinely unexpected failures
 * (network down, malformed JSON, non-JSON response), which callers should
 * treat as "something went wrong, try again" rather than a field-level error.
 */
export async function signUp(values: SignUpFormValues): Promise<SignUpResponse> {
  const body: SignUpRequestBody = {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!isSignUpResponseShape(data)) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  // Even on non-2xx status, a well-formed { success: false, message } body is
  // a normal, expected result — not an exception.
  if (!response.ok && data.success !== false) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  return data;
}

/** Narrows an unknown JSON payload to SignUpResponse before we trust its shape. */
function isSignUpResponseShape(data: unknown): data is SignUpResponse {
  if (typeof data !== "object" || data === null || !("success" in data)) return false;
  const record = data as Record<string, unknown>;

  if (record.success === true) {
    return typeof record.userId === "string" && typeof record.email === "string";
  }
  if (record.success === false) {
    return typeof record.message === "string";
  }
  return false;
}
