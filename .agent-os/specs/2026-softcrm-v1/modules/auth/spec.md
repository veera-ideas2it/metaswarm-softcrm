# Module: Auth
# SoftCRM v1

---

## Purpose
Authenticate users and manage session lifecycle. Provides JWT-based login/logout,
token refresh, and the current-user endpoint consumed by every other module.

---

## Features
- Email + password login
- JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Transparent token refresh via axios interceptor
- Logout with server-side refresh token invalidation
- Current user profile fetch
- Protected route wrapper for frontend

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /api/v1/auth/login | Email/password login — returns access_token, refresh_token, user | None |
| POST | /api/v1/auth/refresh | Rotate access_token using refresh_token cookie | Refresh cookie |
| POST | /api/v1/auth/logout | Invalidate refresh token | Bearer |
| GET  | /api/v1/auth/me | Return current authenticated user | Bearer |

---

## UI Requirements

**Login Page (`/login`)**
- Email field + password field
- Zod validation: required fields, valid email format
- Inline error display at field level and for server errors
- Submit button with loading state

**Token Storage**
- `access_token`: stored in memory (not localStorage)
- `refresh_token`: stored in httpOnly cookie (set by server)

**Axios Interceptor**
- Attaches `Authorization: Bearer <access_token>` to every request
- On 401 response: silently calls `/auth/refresh`, retries original request once
- On refresh failure: clears session, redirects to `/login`

**Protected Route**
- `<RequireAuth>` wrapper component
- Redirects unauthenticated users to `/login`
- Preserves intended destination for post-login redirect

---

## Acceptance Criteria
- [ ] Valid credentials → logged in, redirected to `/pipeline`
- [ ] Invalid credentials → inline error message, no redirect
- [ ] Expired access token → auto-refreshed transparently without user action
- [ ] Logout clears session and redirects to `/login`
- [ ] Navigating to protected route while logged out → redirected to `/login`
- [ ] `GET /auth/me` returns 401 with missing or invalid token
- [ ] Auth endpoints rate-limited to 10 req/min

---

## Dependencies
- [Database: users table](../../architecture/database.md)
- [RBAC roles](../../architecture/rbac.md)
- python-jose (JWT signing/verification)
- passlib[bcrypt] (password hashing)
- axios (frontend interceptor)
