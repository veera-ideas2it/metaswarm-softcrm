# Tech Stack
# SoftCRM

## Frontend
- **Framework:** React 18 + TypeScript (strict)
- **Build tool:** Vite
- **Styling:** TailwindCSS (tokens-driven, no hardcoded colors)
- **Server state:** TanStack Query v5
- **Client state:** Zustand
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **Drag & drop:** dnd-kit (pipeline board)
- **Charts:** Recharts
- **HTTP:** axios (single configured instance)
- **Dates:** date-fns
- **Toasts:** react-hot-toast

## Backend
- **Language:** Python 3.12
- **Framework:** FastAPI (fully async)
- **ORM:** SQLAlchemy 2.0 async
- **DB Driver:** asyncpg
- **Validation:** Pydantic v2
- **Migrations:** Alembic
- **Auth:** python-jose (JWT), passlib[bcrypt]
- **Rate limiting:** slowapi
- **Server:** uvicorn

## Database
- **Engine:** PostgreSQL 15
- **Pattern:** UUID PKs, soft deletes, timestamptz columns

## Infrastructure
- **Local:** Docker + docker-compose (3 services: db, backend, frontend)
- **Deploy target:** Railway (Postgres included, GitHub auto-deploy)
- **Env config:** .env files (pydantic-settings on backend)

## Development Conventions
- All secrets via environment variables — never committed
- All DB changes via Alembic migrations — never manual ALTER
- API versioned at /api/v1/
- Consistent JSON response envelope on all endpoints
