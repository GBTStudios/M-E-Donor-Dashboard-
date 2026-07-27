API Contract — M&E Donor Dashboard

This file is the source of truth for how the frontend (Next.js) and backend (Python/FastAPI) talk to each other. Update this file whenever an endpoint's request/response shape changes — don't let agreements live only in chat.

Auth: Login

Endpoint: POST /auth/login

Request
json
{
  "email": "name@organization.org",
  "password": "yourpassword"
}
Success Response — 200 OK
json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "name@organization.org",
    "name": "Jane Doe"
  }
}
Error Response — 401 Unauthorized
json
{
  "error": "Invalid email or password"
}
Other possible status codes
Status	Meaning	Body
200	Login successful	token + user object
401	Wrong email or password	{ "error": "..." }
422	Malformed request (missing/invalid fields)	FastAPI's default validation error format
429	Too many failed attempts (if rate-limiting is added)	{ "error": "..." }
500	Server error	{ "error": "..." }

Frontend rule: always check the HTTP status code first, then parse the body accordingly. Never assume 200 means success without checking.

Token Details
Type: JWT
Storage: httpOnly cookie (not localStorage) — safer against XSS since JS on the page can't read it.
Expiry:
Default session: short-lived (e.g. 1 day)
"Keep me signed in for 30 days" checked: cookie maxAge set to 30 days
Sending requests after login: cookie is sent automatically by the browser on same-origin requests. Frontend fetch/axios calls need credentials: 'include' (fetch) or withCredentials: true (axios).
CORS note (backend): since frontend and backend likely run on different ports/domains in dev, backend must set Access-Control-Allow-Credentials: true and a specific (not wildcard) Access-Control-Allow-Origin.
Status: Draft
 Login request/response shape agreed
 Status codes agreed
 Token type + storage agreed
 Register endpoint
 Forgot password endpoint
 Google OAuth flow

Last updated: by [your name], [date]