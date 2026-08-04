/**
 * Typed API client for auth endpoints.
 *
 * Matches the real backend contract documented in the API Contract doc:
 * success/failure is determined by HTTP status code, not a `success` field
 * in the body. 201 means success; every other status (409, 422, 401, 500)
 * returns FastAPI's default `{ detail: ... }` shape, where `detail` is either
 * a plain string or (for 422 validation errors) an array of per-field errors.
 */

/** Base URL for API calls — should point at the FastAPI backend (e.g. http://localhost:8000). */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface SignUpRequestBody {
  full_name: string;
  email: string;
  password: string;
}

interface RawSuccessBody {
  id: string;
  email: string;
  message: string;
}

interface RawValidationErrorDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
}

interface RawErrorBody {
  detail: string | RawValidationErrorDetail[];
}

export interface SignUpSuccessResult {
  success: true;
  id: string;
  email: string;
  /** e.g. "Account created. Please verify your email before logging in." */
  message: string;
}

export interface SignUpErrorResult {
  success: false;
  /** Human-readable message for a general error banner. */
  message: string;
  /** Present only for 422 validation errors — maps field name to its message. */
  fieldErrors?: Record<string, string>;
}

export type SignUpResponse = SignUpSuccessResult | SignUpErrorResult;

/** Explicit type guard — used instead of relying on `if (!result.success)`
 * control-flow narrowing, which has been unreliable in this project's dev
 * environment for reasons not yet identified. Same runtime check, just
 * expressed as a predicate function instead. */
export function isSignUpError(result: SignUpResponse): result is SignUpErrorResult {
  return result.success === false;
}

/**
 * Thrown for genuinely unexpected failures — the network is down, the
 * response isn't valid JSON, or the response doesn't match any documented
 * shape. Callers should treat this as "something went wrong, try again",
 * distinct from an expected, documented failure (409/422/401/500).
 */
export class NetworkError extends Error {
  constructor(message = "We couldn't reach the server. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Calls POST /auth/signup with the given signup fields.
 *
 * Takes only what the API contract needs (full_name/email/password) — not
 * the full sign-up form state. confirmPassword is a client-side-only concern
 * (validated in lib/validation.ts) and never sent to the backend.
 *
 * Never throws for documented failure cases (409 duplicate email, 422
 * validation, 401, 500) — those come back as a `{ success: false, message,
 * fieldErrors? }` object. Only throws NetworkError for genuinely unexpected
 * failures (network down, non-JSON response, unrecognized shape).
 */
export async function signUp(values: SignUpRequestBody): Promise<SignUpResponse> {
  const body: SignUpRequestBody = {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    password: values.password,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/signup`, {
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

  if (response.status === 201) {
    if (!isSuccessBody(data)) {
      throw new NetworkError("The server returned an unexpected response. Please try again.");
    }
    return { success: true, id: data.id, email: data.email, message: data.message };
  }

  // Every other documented status (409, 422, 401, 500) uses { detail: ... }.
  if (!isErrorBody(data)) {
    throw new NetworkError("The server returned an unexpected response. Please try again.");
  }

  if (typeof data.detail === "string") {
    return { success: false, message: data.detail };
  }

  // 422 validation errors: an array of { loc, msg }. Build a field->message
  // map for inline errors, and surface the first message as the banner text.
  const fieldErrors: Record<string, string> = {};
  for (const err of data.detail) {
    const field = err.loc[err.loc.length - 1];
    if (typeof field === "string") fieldErrors[field] = err.msg;
  }
  const firstMessage = data.detail[0]?.msg ?? "Please check your details and try again.";
  return { success: false, message: firstMessage, fieldErrors };
}

function isSuccessBody(data: unknown): data is RawSuccessBody {
  if (typeof data !== "object" || data === null) return false;
  const r = data as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.email === "string" && typeof r.message === "string";
}

function isErrorBody(data: unknown): data is RawErrorBody {
  if (typeof data !== "object" || data === null || !("detail" in data)) return false;
  const detail = (data as Record<string, unknown>).detail;
  if (typeof detail === "string") return true;
  if (Array.isArray(detail)) {
    return detail.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        Array.isArray((item as Record<string, unknown>).loc) &&
        typeof (item as Record<string, unknown>).msg === "string"
    );
  }
  return false;
}