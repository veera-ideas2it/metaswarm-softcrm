# Standard: API Conventions
# Applies to: all FastAPI route definitions and frontend API calls

## Base URL
- All routes: /api/v1/{resource}
- Health check: /health (no version prefix)
- Auth routes: /api/v1/auth/{action}

## HTTP Methods
- GET    → read (list or single)
- POST   → create
- PATCH  → partial update (never PUT)
- DELETE → soft delete (sets deleted_at)

## Route Patterns
```
GET    /api/v1/deals              → list deals (paginated)
POST   /api/v1/deals              → create deal
GET    /api/v1/deals/{id}         → get single deal
PATCH  /api/v1/deals/{id}         → update deal fields
DELETE /api/v1/deals/{id}         → soft delete deal
PATCH  /api/v1/deals/{id}/stage   → move deal to new stage
GET    /api/v1/deals/{id}/activities → list deal activities
GET    /api/v1/companies/{id}/contacts → contacts of a company
```

## Request Format
- Content-Type: application/json
- Auth: Authorization: Bearer {access_token}
- Pagination params: ?page=1&per_page=20
- Sorting: ?sort_by=created_at&sort_order=desc
- Filtering: ?owner_id=uuid&stage=Demo+Scheduled

## Response Format — Success
```json
{
  "data": { ... },
  "error": null,
  "meta": null
}
```

## Response Format — List (paginated)
```json
{
  "data": [ ... ],
  "error": null,
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

## Response Format — Error
```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Deal not found",
    "details": {}
  },
  "meta": null
}
```

## Standard Error Codes
- NOT_FOUND → 404
- UNAUTHORIZED → 401
- FORBIDDEN → 403
- VALIDATION_ERROR → 422
- CONFLICT → 409 (e.g. email already exists)
- SERVER_ERROR → 500

## Auth Endpoints
```
POST /api/v1/auth/login      body: {email, password} → {access_token, refresh_token, user}
POST /api/v1/auth/refresh    body: {refresh_token}   → {access_token}
POST /api/v1/auth/logout     header: Bearer token    → 200 OK
GET  /api/v1/auth/me         header: Bearer token    → {user}
```

## Headers
Every response includes:
- Content-Type: application/json
- X-Request-ID: uuid (for tracing)

## Versioning
- Current version: v1
- Breaking changes → bump to v2, keep v1 alive for 3 months
