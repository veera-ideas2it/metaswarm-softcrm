# Standard: Python FastAPI Backend
# Applies to: all backend code

## Language and Runtime
- Python 3.12+
- FastAPI with full async/await (no sync endpoints)
- uvicorn as the ASGI server

## Project Structure
```
backend/
├── app/
│   ├── main.py          # App factory, CORS, router registration
│   ├── config.py        # Pydantic-settings, all env vars here
│   ├── database.py      # Async SQLAlchemy engine + session
│   ├── dependencies.py  # get_db(), get_current_user(), require_role()
│   ├── models/          # SQLAlchemy ORM models only
│   ├── schemas/         # Pydantic v2 request/response schemas
│   ├── routers/         # FastAPI route handlers — HTTP only, thin
│   ├── services/        # Business logic — all heavy lifting here
│   └── auth/            # JWT creation, password hashing
├── alembic/             # DB migrations
├── alembic.ini
└── requirements.txt
```

## Layering Rules
- Routers: validate input, call service, return response — nothing else
- Services: all business logic, DB queries, error raising
- Models: ORM definition only — no methods or logic
- Schemas: request/response shapes — never share ORM models directly

## ORM and Database
- SQLAlchemy 2.0 with async engine (asyncpg driver)
- Every model inherits from Base and includes:
  - id: UUID primary key, server_default=uuid_generate_v4()
  - created_at: DateTime, server_default=func.now()
  - updated_at: DateTime, onupdate=func.now()
  - deleted_at: DateTime nullable (soft delete pattern)
- Never use .query — always use async with session: select()
- Always add indexes on FK columns and frequently filtered columns

## Pydantic Schemas
- Pydantic v2 (model_validator, field_validator)
- Separate schemas: CreateSchema, UpdateSchema, ResponseSchema
- Use model_config = ConfigDict(from_attributes=True) on response schemas
- Never expose hashed_password in any response schema

## Error Handling
- Raise HTTPException with specific status codes from services
- 400: validation error, 401: not authenticated, 403: forbidden,
  404: not found, 409: conflict, 422: unprocessable, 500: server error
- Always include a clear detail message

## Auth
- JWT: access token (15 min), refresh token (7 days)
- python-jose for JWT, passlib[bcrypt] for passwords
- Bearer token in Authorization header
- Role-based: get_current_user() for any auth, require_role("admin") for admin-only

## Response Format
All endpoints return consistent JSON:
```json
{
  "data": { ... },       // single object or list
  "error": null,         // or {"code": "NOT_FOUND", "message": "..."}
  "meta": {              // for paginated lists only
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

## Pagination
- All list endpoints accept: page (default 1), per_page (default 20, max 100)
- All list endpoints accept: sort_by, sort_order (asc/desc)
- Return meta object with total count

## Environment Variables
- All config via pydantic-settings in config.py
- Never hardcode secrets, URLs, or credentials anywhere
- Required vars: DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS

## Rate Limiting
- slowapi on all public endpoints
- Default: 100 requests/minute per IP
- Auth endpoints: 10 requests/minute per IP

## CORS
- Configured in main.py from ALLOWED_ORIGINS env var
- Never use wildcard * in production
