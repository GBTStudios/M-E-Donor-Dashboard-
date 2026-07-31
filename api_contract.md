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

### Other possible status codes

| Status | Meaning | Body |
|---|---|---|
| `200` | Always returned for a well-formed request | `{ "message": "..." }` |
| `422` | Malformed request | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

---

## Auth: Verify Reset Code

**Endpoint:** `POST /auth/verify-reset-code`

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

### Error Responses

| Status | Meaning | Body |
|---|---|---|
| `400` | Code doesn't match, or was already used | `{ "detail": "Invalid code." }` |
| `410` | Code matched but has expired | `{ "detail": "This code has expired..." }` |
| `422` | Malformed request | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

---

## Auth: Reset Password

**Endpoint:** `POST /auth/reset-password`

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

### Error Responses

| Status | Meaning | Body |
|---|---|---|
| `400` | Code doesn't match, or was already used | `{ "detail": "Invalid code." }` |
| `410` | Code matched but has expired | `{ "detail": "This code has expired..." }` |
| `422` | Malformed request (e.g. missing `newPassword`) | FastAPI's default validation error format |
| `500` | Server error | `{ "detail": "..." }` |

**Known limitation:** resetting a password does not invalidate existing JWTs — out of scope for now, flagged as a follow-up.

---

## Auth: Email Verification (signup flow)

**Endpoint:** `POST /auth/verify-email`

### Request
```json
{ "email": "name@organization.org", "code": "123456" }
```

### Success Response — `200 OK`
```json
{ "message": "Email verified successfully. You can now log in." }
```

### Error Response — `400 Bad Request`
```json
{ "detail": "Invalid verification code." }
```
or
```json
{ "detail": "Verification code has expired. Please request a new one." }
```

---

**Endpoint:** `POST /auth/resend-code`

### Request
```json
{ "email": "name@organization.org" }
```

### Success Response — `200 OK`
```json
{ "message": "A new verification code has been sent to your email." }
```

### Error Responses

| Status | Meaning | Body |
|---|---|---|
| `404` | No account exists with this email | `{ "detail": "No account found with this email." }` |
| `400` | Account is already verified | `{ "detail": "This account is already verified." }` |

---

## Admin Auth (applies to every `/admin/*` route below)

All admin routes are protected by a shared, reusable check — not duplicated per-route. Every `/admin/*` endpoint requires the same header used everywhere else:

```
Authorization: Bearer <access_token>
```

This is the **same token** returned by `/auth/login` — there is no separate "admin token." Whether a user can access admin routes depends entirely on their account's `is_admin` flag in the database, checked fresh on every request (not encoded in the token itself).

### The two failure modes are different status codes — frontend must handle them differently

| Status | Meaning | Body | Suggested frontend behavior |
|---|---|---|---|
| `401` | No token sent, or token invalid/expired | `{ "detail": "Not authenticated" }` or `{ "detail": "Invalid or expired token" }` | Redirect to login |
| `403` | Token is valid, user is logged in, but `is_admin` is `false` | `{ "detail": "Admin access required" }` | Show an access-denied message — do **not** treat the same as `401` |

### Becoming an admin

There is currently **no self-serve way** to become an admin — `is_admin` must be manually set to `true` directly in the database for a specific account. If you need an admin test account during development, ask the backend team to flip this for you; there's no signup flow or UI toggle for it.

---

## Stories

### Public: List Stories

**Endpoint:** `GET /stories`

No auth required. Used by the landing page's Impact Stories section.

**Query params:** `limit` (optional, default `10`, min `1`, max `50`)

### Success Response — `200 OK`

```json
[
  {
    "id": "uuid-string",
    "name": "Joan Kisakye",
    "title": "From odd jobs to software engineering",
    "body": "Joan learned to build and maintain apps and now works as a software Engineer",
    "image_url": "https://.../story-images/abc123.jpg",
    "featured": true,
    "created_at": "2026-07-30T14:10:58.702958Z"
  }
]
```

Always returns an **array**, even if there's only one story or zero stories (`[]`). Ordered by `featured` first (true before false), then `created_at` descending (newest first).

`image_url` is `null` if no image was uploaded for that story.

---

### Admin: List All Stories

**Endpoint:** `GET /admin/stories`

Admin auth required (see Admin Auth section above). Same shape as public `/stories`, but includes `updated_at` and is not limited/filtered — returns every story.

### Success Response — `200 OK`

```json
[
  {
    "id": "uuid-string",
    "name": "Joan Kisakye",
    "title": "From odd jobs to software engineering",
    "body": "...",
    "image_url": null,
    "featured": true,
    "created_at": "2026-07-30T14:10:58.702958Z",
    "updated_at": "2026-07-30T14:10:58.702958Z"
  }
]
```

---

### Admin: Create Story

**Endpoint:** `POST /admin/stories`

Admin auth required. **This is `multipart/form-data`, not JSON** — it accepts a file upload.

### Request (form fields)

| Field | Type | Required |
|---|---|---|
| `name` | text | yes |
| `title` | text | yes |
| `body` | text | yes |
| `featured` | boolean | no (default `false`) |
| `image` | file (JPEG/PNG/WEBP, max 5MB) | no |

### Success Response — `201 Created`

```json
{
  "id": "uuid-string",
  "name": "Test Person",
  "title": "Test Title",
  "body": "Test body text",
  "image_url": null,
  "featured": false,
  "created_at": "2026-07-30T19:54:53.259870Z",
  "updated_at": "2026-07-30T19:54:53.259870Z"
}
```

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `422` | Empty `name`/`title`/`body`, or image isn't JPEG/PNG/WEBP, or image exceeds 5MB |

---

### Admin: Update Story

**Endpoint:** `PUT /admin/stories/{id}`

Admin auth required. Also `multipart/form-data`. **All fields are optional** — only send what you want to change; anything omitted stays as-is. Sending a new `image` replaces the existing one.

### Success Response — `200 OK`

Same shape as create, with `updated_at` refreshed.

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No story exists with that `id` |
| `422` | No fields provided at all, or image fails validation |

---

### Admin: Delete Story

**Endpoint:** `DELETE /admin/stories/{id}`

Admin auth required. Also deletes the associated image from Storage if one exists (best-effort — deletion of the story record still succeeds even if image cleanup fails).

### Success Response — `200 OK`

```json
{
  "message": "Story deleted.",
  "id": "uuid-string"
}
```

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No story exists with that `id` |

---

## Landing Page Statistics

There is only ever **one row** of stats — no `id` needs to be sent by the frontend for any of these endpoints. The backend always operates on the single existing row.

### Public: Get Stats

**Endpoint:** `GET /stats/landing-summary`

No auth required.

### Success Response — `200 OK`

```json
{
  "id": "uuid-string",
  "participants": 153,
  "graduation_rate": 93.0,
  "employment_rate": 98.0,
  "income_growth_multiplier": 22.0,
  "cohorts": 6,
  "refugee_participants_pct": 4.0,
  "updated_at": "2026-07-30T19:58:01.999694Z",
  "updated_by": null
}
```

Percentage-style fields (`graduation_rate`, `employment_rate`, `refugee_participants_pct`) are plain numbers meaning percent — `93.0` means 93%, not `0.93`.

### Error Responses

| Status | Meaning |
|---|---|
| `404` | Stats row hasn't been seeded yet (shouldn't happen in practice — flag to backend if seen) |

---

### Admin: Get Stats

**Endpoint:** `GET /admin/stats/landing-summary`

Admin auth required. Identical response shape to the public endpoint — used to pre-fill the admin edit form.

---

### Admin: Update Stats

**Endpoint:** `PUT /admin/stats/landing-summary`

Admin auth required. **This one is plain JSON**, not multipart (no file upload involved). All fields optional — send only what changed.

### Request

```json
{
  "participants": 160
}
```

### Success Response — `200 OK`

Full updated row, same shape as the GET response. `updated_at` and `updated_by` (set to the admin's user id) are always set automatically by the backend — don't send these yourself, they're ignored if included.

### Validation rules

| Field | Rule |
|---|---|
| `participants` | integer, `>= 0` |
| `graduation_rate` | number, `0`–`100` |
| `employment_rate` | number, `0`–`100` |
| `income_growth_multiplier` | number, `>= 0` |
| `cohorts` | integer, `>= 0` |
| `refugee_participants_pct` | number, `0`–`100` |

### Error Responses

| Status | Meaning | Body |
|---|---|---|
| `401` / `403` | See Admin Auth section | |
| `422` | A field is out of range, or no fields were sent at all | FastAPI's default validation format — shows exactly which field failed and why, e.g. `{"detail":[{"type":"less_than_equal","loc":["body","graduation_rate"],"msg":"Input should be less than or equal to 100",...}]}` |

---

## Email Sending

- **Provider:** Resend (`resend` Python package)
- **Codes:** 6-digit numeric, generated server-side
- **Expiry:** Signup verification codes: 15 minutes · Password reset codes: 30 minutes
- Both flows send from `onboarding@resend.dev` (Resend's sandbox sender) — needs a verified custom domain before production, since the sandbox sender can only email the account owner's own address.

---

## Status: Draft

- [x] Login request/response shape agreed
- [x] Status codes agreed
- [x] Token type + storage agreed (bearer token in body, not cookie)
- [x] `user` object added to login response
- [x] Forgot password / verify reset code / reset password endpoints
- [x] Email verification (signup) endpoints documented
- [x] Admin auth pattern documented (401 vs 403, token reuse, no self-serve admin)
- [x] Stories endpoints (public + admin CRUD) built and tested
- [x] Landing stats endpoints (public + admin get/update) built and tested
- [ ] "Keep me signed in for 30 days" wired to token expiry
- [ ] Register/signup endpoint contract (core signup shape still needs documenting here)
- [ ] Google OAuth flow contract
- [ ] Session/token invalidation on password reset (currently out of scope, flagged as a gap)
- [ ] Reconcile `400` vs `410` for expired codes between signup verification and password reset (currently inconsistent)
- [ ] Reconcile whether `/auth/resend-code`'s `404` (reveals email existence) is intentional
- [ ] Image upload on `POST /admin/stories` / `PUT /admin/stories/{id}` — endpoint built but not yet tested with a real file; treat as unverified until confirmed
- [ ] AI assistant / chatbot for donor dashboard — still in planning, no spec written yet, out of scope for current work

_Last updated: by [your name], [date]_