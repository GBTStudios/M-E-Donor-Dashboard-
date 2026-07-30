# API Contract — M&E Donor Dashboard

This file is the source of truth for how the frontend (Next.js) and backend (Python/FastAPI) talk to each other. Update this file whenever an endpoint's request/response shape changes — don't let agreements live only in chat.

---

## Auth: Login

**Endpoint:** `POST /auth/login`

### Request

```json
{
  "email": "name@organization.org",
  "password": "yourpassword"
}
```

### Success Response — `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "name@organization.org",
    "full_name": "Jane Doe"
  }
}
```

### Error Response — `401 Unauthorized`

```json
{
  "detail": "Invalid email or password"
}
```

Note: this is FastAPI's default error key, `detail` — not `error`. Frontend should read `detail`.

The same generic message is returned whether the email doesn't exist, the password is wrong, or the account isn't verified yet — this is intentional, so the frontend can't be used to figure out which emails are registered.

### Other possible status codes

| Status | Meaning | Body |
|---|---|---|
| `200` | Login successful | `access_token` + `token_type` + `user` object |
| `401` | Wrong email/password, or account not yet verified | `{ "detail": "Invalid email or password" }` |
| `422` | Malformed request (missing/invalid fields) | FastAPI's default validation error format |
| `429` | Too many login attempts — rate-limited to 5/minute per IP | `{ "detail": "..." }` |
| `500` | Server error | `{ "detail": "..." }` |

**Frontend rule:** always check the HTTP status code first, then parse the body accordingly. Never assume `200` means success without checking.

---

## Token Details

- **Type:** JWT
- **Storage:** returned in the response body as `access_token` — frontend stores it (e.g. in memory or localStorage) and sends it on future requests as an `Authorization: Bearer <access_token>` header. This is a change from the original plan (httpOnly cookie) — the team went with bearer-token-in-body since that's what's already implemented on backend.
- **Expiry:** currently a fixed session length set by the backend (`access_token_expire_minutes`), not yet tied to "Keep me signed in for 30 days." That checkbox isn't wired to anything on the backend yet — flag this to the team if it needs to control token lifetime.
- **Sending requests after login:** frontend must attach `Authorization: Bearer <token>` manually on every authenticated request — no cookie is set, so nothing happens automatically.

---

## Auth: Forgot Password

**Endpoint:** `POST /auth/forgot-password`

Sends a 6-digit reset code to the user's email if an account exists. Always returns the same generic success message, whether or not the email is registered — this prevents the endpoint from being used to check which emails exist (same principle as login's generic error).

### Request

```json
{
  "email": "name@organization.org"
}
```

### Success Response — `200 OK`

```json
{
  "message": "If an account exists with this email, a reset code has been sent."
}
```

Note: this response is identical whether the email exists or not. Frontend should not infer anything from it beyond "check your email."

### Other possible status codes

| Status | Meaning | Body |
|---|---|---|
| `200` | Always returned for a well-formed request | `{ "message": "..." }` |
| `422` | Malformed request (missing/invalid email field) | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

---

## Auth: Verify Reset Code

**Endpoint:** `POST /auth/verify-reset-code`

Checks whether a submitted code is valid and not expired, without consuming it. Used by the frontend to move the user from the "enter code" screen to the "enter new password" screen before actually resetting anything.

### Request

```json
{
  "email": "name@organization.org",
  "code": "123456"
}
```

### Success Response — `200 OK`

```json
{
  "message": "Code verified. You may now reset your password."
}
```

### Error Response — `400 Bad Request`

```json
{
  "detail": "Invalid code."
}
```

### Error Response — `410 Gone`

```json
{
  "detail": "This code has expired. Please request a new one."
}
```

Frontend should treat `410` distinctly from `400` — the code format was fine but it's expired, so the UI should prompt the user to request a new code rather than just "try again."

### Other possible status codes

| Status | Meaning | Body |
|---|---|---|
| `200` | Code is valid and unexpired | `{ "message": "..." }` |
| `400` | Code doesn't match, or was already used | `{ "detail": "Invalid code." }` |
| `410` | Code matched but has expired | `{ "detail": "This code has expired..." }` |
| `422` | Malformed request | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

---

## Auth: Reset Password

**Endpoint:** `POST /auth/reset-password`

Sets a new password for the account, given a valid, unexpired code. This endpoint re-validates the code independently (it doesn't trust that `/verify-reset-code` was called first), so it can be called directly.

### Request

```json
{
  "email": "name@organization.org",
  "code": "123456",
  "newPassword": "yourNewPassword1"
}
```

### Success Response — `200 OK`

```json
{
  "message": "Password reset successfully. You can now log in."
}
```

### Error Response — `400 Bad Request`

```json
{
  "detail": "Invalid code."
}
```

### Error Response — `410 Gone`

```json
{
  "detail": "This code has expired. Please request a new one."
}
```

### Other possible status codes

| Status | Meaning | Body |
|---|---|---|
| `200` | Password updated successfully | `{ "message": "..." }` |
| `400` | Code doesn't match, or was already used | `{ "detail": "Invalid code." }` |
| `410` | Code matched but has expired | `{ "detail": "This code has expired..." }` |
| `422` | Malformed request (e.g. missing `newPassword`) | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

### Known limitation (flagged, not yet built)

Resetting a password does **not** currently invalidate existing JWTs. If a user's account was compromised and they reset their password for that reason, any previously issued token remains valid until it naturally expires (see Token Details above). Session invalidation on password reset is intentionally out of scope for this pass — noted below as a follow-up item.

---

## Auth: Email Verification (signup flow)

These support the signup flow's verification step — separate from password reset, using a different code table (`verification_codes` vs `password_reset_codes`) so a signup code can never be used to reset a password, or vice versa.

**Endpoint:** `POST /auth/verify-email`

### Request
```json
{
  "email": "name@organization.org",
  "code": "123456"
}
```

### Success Response — `200 OK`
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

### Error Response — `400 Bad Request`
```json
{
  "detail": "Invalid verification code."
}
```
or
```json
{
  "detail": "Verification code has expired. Please request a new one."
}
```

Note: unlike password reset, expired signup codes currently return `400`, not `410`. Flag to the team if this should be made consistent.

---

**Endpoint:** `POST /auth/resend-code`

### Request
```json
{
  "email": "name@organization.org"
}
```

### Success Response — `200 OK`
```json
{
  "message": "A new verification code has been sent to your email."
}
```

### Error Responses

| Status | Meaning | Body |
|---|---|---|
| `404` | No account exists with this email | `{ "detail": "No account found with this email." }` |
| `400` | Account is already verified | `{ "detail": "This account is already verified." }` |

Note: unlike `/auth/forgot-password`, this endpoint **does** reveal whether an email is registered (via `404`). This is an inconsistency worth discussing with the team — it's a smaller information leak than login's, but worth deciding if it's intentional.

---

## Email Sending

- **Provider:** Resend (`resend` Python package)
- **Codes:** 6-digit numeric, generated server-side
- **Expiry:**
  - Signup verification codes: 15 minutes
  - Password reset codes: 30 minutes
- Both flows send from `onboarding@resend.dev` (Resend's default sandbox sender) — will need a verified custom domain sender before production launch.

---

## Status: Draft

- [x] Login request/response shape agreed
- [x] Status codes agreed
- [x] Token type + storage agreed (bearer token in body, not cookie)
- [x] `user` object added to login response
- [x] Forgot password endpoint
- [x] Verify reset code endpoint
- [x] Reset password endpoint
- [x] Email verification (signup) endpoints documented
- [ ] "Keep me signed in for 30 days" wired to token expiry
- [ ] Register/signup endpoint contract (core signup shape still needs documenting here)
- [ ] Google OAuth flow contract
- [ ] Session/token invalidation on password reset (currently out of scope, flagged as a gap)
- [ ] Reconcile `400` vs `410` for expired codes between signup verification and password reset (currently inconsistent)
- [ ] Reconcile whether `/auth/resend-code`'s `404` (reveals email existence) is intentional, given `/auth/forgot-password` deliberately avoids this

_Last updated: by Janet 29/07/2026
