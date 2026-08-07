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


## Knowledge Base: Document Curation (Stage 1)

### What this is

An admin-only workflow for turning raw documents (PDF, Word, Excel, CSV) into reviewed, approved content that will eventually feed the donor-facing chatbot. **This contract covers Stage 1 only**: upload → parse → AI summarize → human review/edit → publish or exclude. It does **not** yet cover embeddings, vector search, or the chatbot's retrieval logic — that's a separate Stage 2, deferred until this stage is stable and has real published content to work with.

**Nothing here reaches the chatbot or donors until a document's status is `published`.** This is the core safety guarantee of the whole feature — treat it as non-negotiable when building the frontend review screen.

### Status lifecycle

A document moves through these states, in order (except `excluded`, which can happen from `pending` at any point):

```
processing → pending → published
                　  ↳ excluded
```

| Status | Meaning |
|---|---|
| `processing` | File uploaded, parsing + AI summarization running in the background. Not yet visible to an admin for review. |
| `pending` | Extraction + AI summary complete. Waiting for an admin to review, optionally edit, and either publish or exclude it. |
| `published` | Approved. This is the only status the future chatbot retrieval will ever read from. |
| `excluded` | Admin explicitly rejected this document. Permanently out of consideration (not deleted, just never used). |

### Admin auth

Same pattern as every other `/admin/*` route in this app — see the **Admin Auth** section above. All endpoints below require `Authorization: Bearer <access_token>` and `is_admin`/role-based admin access (401 vs 403 rules identical to elsewhere).

---

### Upload a Document

**Endpoint:** `POST /admin/documents`

`multipart/form-data`. Accepts one file: PDF, DOCX, XLSX, or CSV. Max size 25MB.

**Important: this returns immediately** — it does not wait for parsing or AI summarization to finish. Those happen in the background. The response confirms the upload was received and processing has started; poll `GET /admin/documents/{id}` afterward to see when the summary is ready.

### Request (form fields)

| Field | Type | Required |
|---|---|---|
| `file` | file (PDF/DOCX/XLSX/CSV, max 25MB) | yes |

### Success Response — `202 Accepted`

```json
{
  "id": "uuid-string",
  "filename": "Cohort 5 endline results.pdf",
  "status": "processing"
}
```

Note the status code is `202 Accepted`, not `200` or `201` — this is the standard HTTP way of saying "request accepted, work is happening asynchronously, check back later."

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `422` | Wrong file type, file exceeds 25MB, or no file provided |

---

### List Documents (Registry)

**Endpoint:** `GET /admin/documents`

Optional query param: `status` (filter to just `processing`, `pending`, `published`, or `excluded`). Omit to get all.

### Success Response — `200 OK`

```json
[
  {
    "id": "uuid-string",
    "filename": "Cohort 5 endline results.pdf",
    "file_type": "pdf",
    "status": "pending",
    "uploaded_by": "uuid-string",
    "created_at": "2026-08-03T10:00:00Z",
    "updated_at": "2026-08-03T10:00:45Z",
    "published_at": null
  }
]
```

This is the list view only — no `raw_text`, `ai_summary`, or `final_content` included, since those can be large. Use the detail endpoint below for the full document.

---

### Get Document Detail

**Endpoint:** `GET /admin/documents/{id}`

### Success Response — `200 OK`

```json
{
  "id": "uuid-string",
  "filename": "Cohort 5 endline results.pdf",
  "file_type": "pdf",
  "file_url": "https://.../knowledge-documents/abc123.pdf",
  "status": "pending",
  "raw_text": "... full extracted raw text from the file ...",
  "ai_summary": "COHORT 5 ENDLINE RESULTS - EXECUTIVE SUMMARY\n\n...",
  "final_content": "COHORT 5 ENDLINE RESULTS - EXECUTIVE SUMMARY\n\n...",
  "uploaded_by": "uuid-string",
  "created_at": "2026-08-03T10:00:00Z",
  "updated_at": "2026-08-03T10:00:45Z",
  "published_at": null
}
```

`final_content` starts as an exact copy of `ai_summary` the moment processing finishes. The frontend's editable "OVERRIDE / REFINE" panel edits `final_content`, never `ai_summary` directly — `ai_summary` is preserved as the original AI output for reference, in case an admin wants to revert or compare.

While `status` is `"processing"`, `raw_text`, `ai_summary`, and `final_content` will all be `null` — frontend should show a loading/processing state, not attempt to render them.

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No document exists with that `id` |

---

### Save Edited Content

**Endpoint:** `PUT /admin/documents/{id}`

This is the "Save Edit" button. Updates `final_content` only — does not change status, does not publish anything.

### Request

```json
{
  "final_content": "The admin's edited version of the summary text..."
}
```

### Success Response — `200 OK`

Full document object, same shape as the detail endpoint, with `final_content` and `updated_at` updated.

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No document exists with that `id` |
| `422` | `final_content` missing or empty |

---

### Publish a Document

**Endpoint:** `POST /admin/documents/{id}/publish`

This is the "Approve & Publish" button. Sets `status` to `"published"` and `published_at` to the current time. Whatever is currently saved in `final_content` at this moment becomes the permanent published version.

**Stage 1 note:** this endpoint does *not* yet trigger embedding generation or make anything available to a chatbot — that's Stage 2, not built yet. Right now, "publish" only means "marked as approved in this admin tool."

### Success Response — `200 OK`

Full document object, `status: "published"`, `published_at` set.

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No document exists with that `id` |
| `409` | Document is not in `pending` status (e.g. already published, or still processing) — can't publish from any other state |

---

### Exclude a Document

**Endpoint:** `POST /admin/documents/{id}/exclude`

Sets `status` to `"excluded"`. The document record and file are kept (not deleted), just permanently marked as rejected.

### Success Response — `200 OK`

Full document object, `status: "excluded"`.

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No document exists with that `id` |

---

### Delete a Document

**Endpoint:** `DELETE /admin/documents/{id}`

Fully removes the document record and its file from Storage. Unlike "exclude," this is permanent and irreversible.

### Success Response — `200 OK`

```json
{ "message": "Document deleted.", "id": "uuid-string" }
```

### Error Responses

| Status | Meaning |
|---|---|
| `401` / `403` | See Admin Auth section |
| `404` | No document exists with that `id` |

---

### Explicitly out of scope for Stage 1 (do not build against these yet)

- No embedding generation happens on publish yet.
- No vector database is populated yet.
- There is no chatbot retrieval endpoint yet.
- Vector DB is planned to be **Supabase pgvector** (not Pinecone/Qdrant) once Stage 2 starts, to avoid standing up a separate service.
- Summarization LLM is **OpenAI** — exact model choice not yet finalized/documented.

If the frontend needs to show "this document powers the chatbot" messaging, it should say so only for `published` documents, and should not imply real-time sync until Stage 2 actually exists.

### Known gap: AI summarization untested end-to-end

The full pipeline (upload → parse → background task → AI summarization → save) has been built. The provider was switched from OpenAI to **Anthropic** (Claude) partway through — `summarizer.py` and `image_text_extractor.py` both now use the Anthropic SDK (`claude-haiku-4-5-20251001`). The integration is confirmed correctly wired end-to-end: a real request reaches Anthropic's API and returns a clean, expected `401 authentication_error` against a placeholder key. However, a **successful** response has not yet been observed — testing is blocked on a real, funded Anthropic API key being added to `.env`. Until confirmed, treat `ai_summary`/`final_content` output as unverified. Embedded-image text extraction (via Claude vision) is similarly untested for the same reason.


## Uploaded Documents (Audit Log & Export)

### What this is

A separate admin screen from Knowledge Base — a full audit table of every uploaded document (not just pending/review items), with search, pagination, and CSV export. **This uses a different endpoint from the Knowledge Base page on purpose**, to avoid a breaking change to `GET /admin/documents` (which the Knowledge Base page already depends on and returns a plain array, unpaginated). Do not confuse the two:

| Page | Endpoint | Response shape |
|---|---|---|
| Knowledge Base (curation) | `GET /admin/documents` | Plain array `[...]` |
| Uploaded Documents (audit) | `GET /admin/documents/audit` | Paginated envelope `{ documents, total, page, limit }` |

Both read from the same underlying `documents` table — just shaped differently for their respective screens.

### Admin auth

Same as every other `/admin/*` route — see the Admin Auth section.

---

### List Documents (Audit View)

**Endpoint:** `GET /admin/documents/audit`

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | `1` | 1-indexed |
| `limit` | int | `20` | max `100` |
| `search` | string | none | **Currently matches filename only** — see Known Limitations below |
| `status` | string | none | `processing` / `pending` / `published` / `excluded` / omit for all |

### Success Response — `200 OK`

```json
{
  "documents": [
    {
      "id": "uuid-string",
      "display_id": "DOC-1824",
      "filename": "Cohort 5 endline results.pdf",
      "file_size_bytes": 2516582,
      "status": "pending",
      "uploaded_by": "uuid-string",
      "uploaded_by_name": "Alex Rivers",
      "created_at": "2026-08-04T10:00:00Z",
      "updated_at": "2026-08-04T10:00:45Z",
      "published_at": null
    }
  ],
  "total": 1284,
  "page": 1,
  "limit": 20
}
```

- `display_id` is a human-readable ID (`DOC-<number>`), auto-generated, not the same as `id` (the real UUID used for all other operations — publish/exclude/delete still use `id`, not `display_id`).
- `file_size_bytes` will be `null` for any document uploaded **before** this feature was added (size wasn't captured historically) — frontend should handle `null` gracefully (e.g. show "—" rather than "0 bytes" or crashing).
- `uploaded_by_name` will be `null` if the uploader's account was deleted, or in edge cases where the join fails.

---

### Export as CSV

**Endpoint:** `GET /admin/documents/audit/export`

Same `search` and `status` query params as the list endpoint above — the export reflects whatever's currently filtered/searched, not always the full table. No `page`/`limit` — export always includes every matching row.

### Response

`200 OK`, `Content-Type: text/csv`, triggers a file download (`Content-Disposition: attachment`). Not JSON — frontend should trigger this as a direct browser download / link click, not parse it as an API response.

**Columns, in order:** Document ID, Filename, File Size (bytes), Status, Uploaded By, Uploaded At, Last Updated, Published At.

**Note:** this is a **CSV file**, not a native `.xlsx` Excel file — opens correctly in Excel/Google Sheets, but if a genuine `.xlsx` (with formatting, multiple sheets, etc.) is required, that's a different, not-yet-built feature.

---

### Known limitations

- **Search only matches `filename`**, not `uploaded_by_name`. Searching by uploader requires filtering across the joined `users` table, which isn't implemented yet. Flag if this is a launch blocker.
- **`file_size_bytes` is `null` for documents uploaded before this feature shipped** — no retroactive backfill has been done.


## Chatbot (RAG-powered Knowledge Assistant)

### Status: Built and tested end-to-end

**Correction from earlier drafts:** an earlier version of this doc stated this reused an existing "analytics dashboard chatbot" system. That was traced back to an unconfirmed assumption (a comment in frontend code, not an actual working system) — there was no pre-existing chatbot backend anywhere in this project. This was built from scratch.

Sits on the public landing page (`ChatbotButton.tsx`), designed for **anonymous, non-logged-in visitors** — not just logged-in dashboard users.

### What this is (current real state)

A conversational assistant that searches **published** Knowledge Base documents (via RAG — retrieval-augmented generation) and answers questions grounded in that content when relevant, falling back to a general response when nothing relevant is found. Confirmed working end-to-end with real test data — not theoretical. No source citations, by design.

### Endpoints

**`POST /chat/message`**

### Request

```json
{
  "session_id": "uuid-string or null to start a new session",
  "message": "How is the current cohort's employment rate trending?"
}
```

Send only the latest message plus `session_id` — not full history. Server holds multi-turn memory itself via `chat_sessions`/`chat_messages`.

### Response — single JSON, not streaming

```json
{
  "session_id": "uuid-string",
  "response": "Full reply text, returned all at once."
}
```

No token-by-token streaming. Any typing-effect animation in the UI is a pure frontend affordance, not a reflection of how data arrives.

### Auth

**None required.** Public endpoint for anonymous visitors. `session_id` tracks conversation continuity, not a user account.

### Error handling

Same convention as every other endpoint — standard HTTP status codes, `{"detail": "..."}` body.

| Status | Meaning |
|---|---|
| `422` | Malformed request |
| `429` | Rate limited (not yet implemented) |
| `503` / `504` | AI call failed or timed out |

---

**`GET /admin/chat-sessions`** (planned, not yet built)

Admin-protected. Powers "Q&A Logs" / "Chat Audit Logs" admin screens. Exact response shape not yet designed.

---

### Required before public launch (not yet done)

Public + unauthenticated means real abuse/cost exposure — anyone can call it repeatedly at no cost to themselves.

- [ ] Rate limiting (per-IP or similar)
- [ ] Message length caps
- [ ] Monitoring/alerting for unusual volume

### Backend build status

- [x] `document_chunks`, `chat_sessions`, `chat_messages` tables created, RLS + grants set
- [x] Local embedding generation (`sentence-transformers`, 384-dim) — `embeddings.py`
- [x] Chunking + storage service — `document_chunker.py`
- [x] Wired into document-publish flow
- [x] Retrieval function (`search_knowledge_base`) + `match_document_chunks` Postgres function, filters to `published` documents only
- [x] `POST /chat/message` endpoint — built and tested end-to-end, confirmed grounded answers
- [x] Agent/reasoning layer (LangGraph + Claude) — built and tested, tool-calling confirmed working
- [ ] `GET /admin/chat-sessions` — not yet built
- [ ] Rate limiting / abuse protection — not yet built
- [ ] Widget copy updated to reflect real grounded capability now that RAG is actually live

### Known gotcha: no vector index on `document_chunks` (intentional, for now)

An `ivfflat` index was initially added to `document_chunks` but caused **silent retrieval failures** — queries returning empty results with no error — when the table had very few rows. This is a known `pgvector` limitation: `ivfflat` clusters vectors into "lists" for approximate search, and with too few rows the clustering is degenerate, causing valid queries to land in empty clusters and return nothing even though matching data exists.

The index was dropped. **Do not re-add an `ivfflat` index until the table has a meaningful number of chunks (hundreds+)**, and when you do, tune the `lists` parameter properly or consider `hnsw` instead, which handles small-to-medium data more gracefully. Without an index, `document_chunks` currently relies on a full sequential scan for similarity search — fine at current scale, but worth revisiting as the table grows.


## Q&A Analytics & Moderation (Flagged Conversations)

### Status: Planning / Not Yet Built

Nothing in this section exists as working code yet. Documents the agreed design before build.

### Key design decisions

- **Donor identity:** `/chat/message` moves from fully anonymous to **optional auth**. If a valid `Authorization: Bearer <token>` is sent, the real logged-in user's name is captured. If no token (or an invalid one) is sent, the request still succeeds — logged as "Anonymous donor." This is a change to the existing endpoint, not just the new logging feature — no error is ever thrown for a missing/bad token here, unlike admin routes.
- **Flagging is auto-detected**, not manual: a second AI classification step reviews each Q&A exchange for sensitive topics (financials, legal matters, personal/PII data, etc.) and assigns `status`.
- **Flagging runs in the background**, after the donor already has their answer — not synchronously. Stacking a third sequential AI call onto the existing ~4.5s response time (see prior latency investigation) would make the chat feel slow again. Practical effect: a Q&A log entry (and its flagged/declined/answered status) appears in the admin page a few seconds after the actual chat exchange, not instantly.
- **Confidence score: not implemented.** Don't build UI for this field — it doesn't exist and there's no current plan to add it.

### Data model (planned)

**`qa_logs`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `session_id` | uuid | FK to `chat_sessions` |
| `question` | text | |
| `response` | text | |
| `status` | text | `answered` / `declined` / `flagged` |
| `flag_reason` | text, nullable | Set when `status` is `declined` or `flagged` |
| `donor_name` | text, nullable | Real name if logged in, else `"Anonymous donor"` |
| `user_id` | uuid, nullable | FK to `users`, null for anonymous |
| `response_time_ms` | integer | |
| `moderation_status` | text, nullable | `pending` / `resolved` / `false_positive` — only meaningful when `status = 'flagged'` |
| `created_at` | timestamptz | |

**`qa_log_moderator_notes`**
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `qa_log_id` | uuid | FK to `qa_logs` |
| `moderator_id` | uuid | FK to `users` |
| `note` | text | |
| `created_at` | timestamptz | |

---

### Endpoints (all admin-protected, standard 401/403 pattern per Admin Auth section)

**`GET /admin/qa-analytics/summary`**

Today's totals.

```json
{
  "questions_today": 248,
  "answered": 232,
  "declined": 12,
  "flagged": 4
}
```

---

**`GET /admin/qa-analytics/trends`**

Query params: `period` (`daily` / `weekly` / `monthly`), `start`, `end` (dates).

```json
{
  "period": "daily",
  "data": [
    { "date": "2026-08-01", "answered": 40, "declined": 3, "flagged": 1 },
    { "date": "2026-08-02", "answered": 55, "declined": 2, "flagged": 0 }
  ]
}
```

---

**`GET /admin/qa-analytics/flagged`**

Query params: `status` (`pending` / `resolved` / `false_positive`, omit for all), `search` (matches `question` text or `donor_name` — both are plain columns, feasible to search directly), `page`, `limit`.

```json
{
  "items": [
    {
      "id": "uuid-string",
      "question": "What's your total budget for 2026?",
      "response": "I can only answer questions based on our published impact data...",
      "flag_reason": "Financial/budget inquiry",
      "donor_name": "Anonymous donor",
      "created_at": "2026-08-06T04:00:00Z",
      "moderation_status": "pending"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 20
}
```

---

**`GET /admin/qa-analytics/flagged/{id}`**

Full detail, including moderator notes history.

```json
{
  "id": "uuid-string",
  "question": "...",
  "response": "...",
  "flag_reason": "...",
  "donor_name": "...",
  "created_at": "...",
  "moderation_status": "pending",
  "moderator_notes": [
    { "id": "uuid", "moderator_name": "Moses K.", "note": "Confirmed appropriate decline", "created_at": "..." }
  ]
}
```

---

**`PUT /admin/qa-analytics/flagged/{id}/status`**

Request:
```json
{ "moderation_status": "resolved" }
```
Accepts `resolved`, `false_positive`, or `escalated`.

---

**`POST /admin/qa-analytics/flagged/{id}/notes`**

Request:
```json
{ "note": "Confirmed this was an appropriate decline, no action needed." }
```

---

### Build status

- [ ] `qa_logs`, `qa_log_moderator_notes` tables, RLS + grants
- [ ] Optional-auth change to `/chat/message`
- [ ] Background flagging classification step
- [ ] Logging wired into live chat flow
- [ ] All five endpoints above


## Donor Dashboard

### Status: Partially planned — two sections blocked pending data confirmation

### Auth

All endpoints below require a valid logged-in user — same bearer token pattern as everywhere else. **Not admin-restricted** — any authenticated user (donor or admin) can view this. No new "donor-only" role check is being added; if that turns out to be wrong, flag it and we'll add one.

---

### 1. Impact Overview (buildable now)

**Endpoint:** `GET /donor/dashboard/summary`

Reuses `landing_stats` — same underlying table and numbers as the public landing page, just displayed differently here. **Displayed values will be whatever is actually in the database, not necessarily matching mockup placeholder numbers** (e.g. mockup shows 92%/25× — actual values depend on what's stored).

Three new fields need adding to `landing_stats` (don't exist yet): `international_roles_pct`, `african_companies_pct`, `income_sent_home_pct` — all numeric 0–100, same validation pattern as the existing percentage fields.

### Response

```json
{
  "participants": 153,
  "graduation_rate": 93.0,
  "employment_rate": 98.0,
  "income_growth_multiplier": 22.0,
  "cohorts": 6,
  "refugee_participants_pct": 4.0,
  "international_roles_pct": 19.0,
  "african_companies_pct": 81.0,
  "income_sent_home_pct": 33.0,
  "updated_at": "..."
}
```

Admin update goes through the existing `PUT /admin/stats/landing-summary` (with the three new fields added to that schema too) — no new admin endpoint needed.

---

### 2. "Before the Program" Baseline — BLOCKED

**Cannot design this endpoint yet.** This needs household size, pre-program income, breadwinner breakdown, age, education, job type — none of which exist anywhere in the system currently. Before this can be built, need to confirm: **does this raw data already exist in an M&E dataset** (per her question about "Janet's cleaned data"), or does it need to be manually entered by an admin (same pattern as `landing_stats` — one row, admin fills in numbers)?

If real per-participant data exists, this becomes an aggregation query. If not, it becomes a new admin-editable table, much simpler. Please confirm with Janet before this section gets built — building against a guess here risks real rework.

---

### 3. Active Cohort Progress (buildable now)

**Endpoint:** `GET /donor/dashboard/cohorts`

New table needed:
```sql
create table cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active_participants integer not null default 0,
  completion_pct numeric not null default 0,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Response

```json
[
  {
    "id": "uuid",
    "name": "Software Engineering C4",
    "active_participants": 19,
    "completion_pct": 100.0,
    "status": "completed"
  },
  {
    "id": "uuid",
    "name": "Software & AI Engineering C5",
    "active_participants": 33,
    "completion_pct": 85.0,
    "status": "in_progress"
  }
]
```

Admin CRUD for cohorts (create/edit/delete) not yet designed — will follow the same pattern as Stories once needed.

---

### 4. Strategic Insights (buildable now, background-generated)

**Endpoint:** `GET /donor/dashboard/insights`

**Not generated live on page load.** Generated in the background whenever `landing_stats` is updated (triggered from `PUT /admin/stats/landing-summary`, same trigger-on-write pattern as document publishing → embedding), and cached. The GET endpoint just reads the latest cached insights — fast, no AI call on the request path.

```sql
create table dashboard_insights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  generated_at timestamptz not null default now()
);
```

### Response

```json
[
  {
    "title": "Income Growth Milestone",
    "body": "The 22x income growth observed represents..."
  }
]
```

Old insights are replaced (not accumulated) each time new ones are generated — always reflects the current data, not a history log.

---

### 5. District Origin Map — BLOCKED

**Same blocker as section 2.** Needs participant-level district/country data that doesn't currently exist anywhere in the system. Confirm with Janet whether this raw data exists before this gets designed — could be a real aggregation query, or a new manually-entered dataset, depending on the answer.

---

### 6. Export Report

**Format: formatted PDF**, using `fpdf2` (pure Python, no system-level dependencies — avoids the Windows install pain we hit with other tools today).

**Endpoint:** `GET /donor/dashboard/export` (planned — exact content/layout not yet designed, depends on sections 2 and 5 being unblocked first, since a report excluding baseline/district data would be incomplete)

---

### Build status

- [ ] `landing_stats` — 3 new columns added
- [ ] `GET /donor/dashboard/summary`
- [ ] `cohorts` table + `GET /donor/dashboard/cohorts`
- [ ] `dashboard_insights` table + background generation + `GET /donor/dashboard/insights`
- [ ] Baseline panel — **blocked, needs data source confirmation**
- [ ] District map — **blocked, needs data source confirmation**
- [ ] PDF export — blocked behind the above two

## Participant Data Import & Donor Dashboard: Baseline / Origins

### Status: Planning / Not Yet Built

### Auth

All `/admin/participants/*` import routes require admin auth — same `get_current_admin_user` pattern as every other `/admin/*` route (401 vs 403 rules identical). The two donor-facing GET endpoints (`/donor/dashboard/baseline`, `/donor/dashboard/origins`) only require a logged-in user, same as the rest of the Donor Dashboard section.

### Data model

```sql
create table participants (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references cohorts(id),
  household_size integer,
  pre_program_income numeric,
  main_breadwinner text,
  age integer,
  highest_education text,
  employed_before boolean,
  employed_before_type text,
  district text,
  country text default 'Uganda',
  source_import_id uuid,
  created_at timestamptz not null default now()
);

create table participant_imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  file_type text not null,
  status text not null default 'processing',
  row_count integer,
  preview_data jsonb,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table district_coordinates (
  district text primary key,
  latitude numeric not null,
  longitude numeric not null
);
```

`source_import_id` on `participants` traces every row back to the import batch it came from — useful for auditing or rolling back a bad import later.

**`district_coordinates` is populated lazily**, not preloaded with all ~146 Ugandan districts upfront. Coordinates get added only for districts that actually show up in real imported participant data, sourced and verified individually (e.g. from Wikipedia district pages, which carry citable coordinates) rather than bulk-guessed. If a district appears in `participants` but has no matching row here yet, the origins endpoint returns `null` for its lat/long rather than a wrong guess — visible and honest, not silently incorrect on a donor-facing map.

### Import flow — human-reviewed, not blind ingestion

Same review pattern as document curation: **nothing lands in the real `participants` table until an admin explicitly confirms it.**

1. Admin uploads a file (Excel, CSV, PDF, or DOCX).
2. Backend parses it:
   - **Excel/CSV**: direct, exact row/column extraction (reuses `document_parser.py`'s existing spreadsheet parsing) — no AI involved, fully reliable.
   - **PDF/DOCX**: text extracted, then an AI step attempts to structure it into rows. **This carries real accuracy risk** — unlike Excel/CSV, this is AI inference, not exact extraction. Treat PDF/DOCX-sourced data as needing closer admin review than spreadsheet-sourced data.
3. A preview is generated and stored (`preview_data`) — row count, detected columns, a sample of rows — without touching the real `participants` table yet.
4. Admin reviews the preview via the admin UI, can reject or confirm.
5. Only on confirm does the data get inserted into `participants`.

### Endpoints

**`POST /admin/participants/import`**

`multipart/form-data`, one file (Excel/CSV/PDF/DOCX). Admin-protected. Returns immediately with `202 Accepted` — parsing happens in the background.

```json
{ "id": "uuid", "filename": "...", "status": "processing" }
```

**`GET /admin/participants/imports/{id}`**

Admin-protected. Poll for status/preview once processing finishes.

```json
{
  "id": "uuid",
  "status": "pending_review",
  "row_count": 153,
  "preview_data": { "columns": [...], "sample_rows": [...] }
}
```

**`POST /admin/participants/imports/{id}/confirm`**

Admin-protected. Commits the parsed rows into `participants`.

**`POST /admin/participants/imports/{id}/reject`**

Admin-protected. Discards the parsed preview, nothing gets inserted.

---

### Donor Dashboard: Baseline

**Endpoint:** `GET /donor/dashboard/baseline` — logged-in user, not admin-restricted.

Real SQL aggregation over `participants` — not AI-generated, not paraphrased.

```json
{
  "avg_household_size": 5.4,
  "avg_pre_program_income": 10.0,
  "main_breadwinner_breakdown": { "Mother": 52, "Father": 31, "Other": 17 },
  "avg_age": 21.0,
  "highest_education_common": "Senior 6",
  "employed_before_pct": 42.0,
  "employed_before_type_common": "Subsistence / Street"
}
```

### Donor Dashboard: Origins

**Endpoint:** `GET /donor/dashboard/origins` — logged-in user, not admin-restricted.

```json
{
  "uganda_districts": [
    { "district": "Kampala", "participant_count": 24, "latitude": 0.3476, "longitude": 32.5825 },
    { "district": "SomeNewDistrict", "participant_count": 2, "latitude": null, "longitude": null }
  ],
  "international": [
    { "country": "South Sudan", "participant_count": 5 },
    { "country": "DRC", "participant_count": 3 },
    { "country": "Rwanda", "participant_count": 2 }
  ]
}
```

`latitude`/`longitude` are `null` for any district not yet added to `district_coordinates` — frontend should handle this gracefully (e.g. omit that pin, or show a "location pending" state) rather than assume they're always present.

---

### Build status

- [ ] `participants`, `participant_imports`, `district_coordinates` tables
- [ ] Excel/CSV import (exact parsing)
- [ ] PDF/DOCX import (AI-assisted extraction, higher review priority)
- [ ] Preview/confirm/reject admin flow
- [ ] `GET /donor/dashboard/baseline`
- [ ] `GET /donor/dashboard/origins`
- [ ] District coordinates populated as real district names become known