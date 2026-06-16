# Architecture: Non-Functional Requirements
# SoftCRM v1

---

## API
- All list endpoints: pagination (`page`, `per_page`), sorting (`sort_by`, `sort_order`)
- All endpoints versioned at `/api/v1/`
- Consistent JSON response envelope on all endpoints
- All endpoints documented at `/docs` (Swagger / FastAPI auto-docs)

## Validation
- Frontend: Zod schema validation on all forms
- Backend: Pydantic v2 validation on all request bodies

## Data Integrity
- Soft deletes on all entities (`deleted_at` column)
- UUID primary keys on all tables

## Rate Limiting
- General endpoints: 100 req/min
- Auth endpoints: 10 req/min

## Infrastructure
- Docker Compose: 3 services (db, backend, frontend)
- `.env.example` with every required variable documented
- All secrets via environment variables — never committed

## Database
- Single Alembic migration for initial schema (all tables in one migration)
- All DB changes via Alembic migrations — never manual ALTER
- Seed script: 1 admin user, 3 sample companies, 5 contacts, 10 deals spread across stages

## Documentation
- README: setup steps, env vars, how to run locally, API docs URL
