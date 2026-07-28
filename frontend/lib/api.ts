/**
 * Typed API client for auth endpoints.
 *
 * Deliberately thin: one function per endpoint, each returning a discriminated
 * union so callers can switch on `success` and get full type narrowing without
 * a try/catch around JSON parsing scattered through components.
 */

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
 * Thrown for genuinely unexpected failures — the network is down, the
 * response isn't valid JSON, or the response doesn't match the agreed
 * contract shape. Callers should treat this as "something went wrong, try
 * again", distinct from an expected `{ success: false, message }` result.
 */
export class NetworkError extends Error {
  constructor(message = "We couldn't reach the server. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Calls POST /api/auth/signup with the given signup fields.
 *
 * Deliberately takes only what the API contract needs (name/email/password) —
 * not the full sign-up form state. confirmPassword is a client-side-only
 * concern (validated in lib/validation.ts) and should never be part of this
 * function's input type or the request body.
 *
 * Never throws for expected failure cases (duplicate email, validation errors,
 * etc.) — those come back as a `{ success: false, message }` object per the
 * agreed contract. Only throws NetworkError for genuinely unexpected failures.
 */
export async function signUp(values: SignUpRequestBody): Promise<SignUpResponse> {
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
    throw new NetworkError();
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new NetworkError("The server returned an unexpected response. Please try again.");
  }

  if (!isSignUpResponseShape(data)) {
    throw new NetworkError("The server returned an unexpected response. Please try again.");
  }

  // Even on non-2xx status, a well-formed { success: false, message } body is
  // a normal, expected result — not an exception.
  if (!response.ok && data.success !== false) {
    throw new NetworkError("The server returned an unexpected response. Please try again.");
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