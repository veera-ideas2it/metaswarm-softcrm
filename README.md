# SoftCRM

A production-ready sales pipeline CRM built for software companies. Manage deals through 12 purpose-built stages — from first lead to closed contract — with a drag-and-drop Kanban board, activity logging, and team dashboards.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 15 |
| Auth | JWT (access 15min + refresh 7d) + bcrypt |
| Infra | Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)
- Ports **5174**, **8000**, and **5432** available on your machine

---

## Quick Start (Development)

```bash
# 1. Clone the repo
git clone <repo-url>
cd crm-project

# 2. Create your .env file
cp .env.example .env
# Edit .env — change SECRET_KEY at minimum

# 3. Start all services (db + backend + frontend)
docker compose up --build

# 4. Seed demo data (first time only)
docker compose exec backend python seed.py
```

The app is now running:

| Service | URL |
|---|---|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

### Demo Credentials

| Email | Password | Role |
|---|---|---|
| admin@softcrm.io | Admin1234! | Admin |
| manager@softcrm.io | Manager1234! | Manager |
| rep@softcrm.io | Rep1234! | Sales Rep |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running.

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_DB` | No | `softcrm` | PostgreSQL database name |
| `POSTGRES_USER` | No | `crm_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | **Yes** | — | PostgreSQL password |
| `DATABASE_URL` | **Yes** | — | Full async connection string: `postgresql+asyncpg://user:pass@db:5432/dbname` |
| `SECRET_KEY` | **Yes** | — | JWT signing secret. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `15` | Access token lifetime in minutes |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Refresh token lifetime in days |
| `ALLOWED_ORIGINS` | **Yes** | `http://localhost:5174` | Comma-separated CORS origins (include your production domain) |
| `VITE_API_BASE_URL` | No | `http://localhost:8000` | Public URL of the backend API (baked into frontend bundle at build time) |

---

## Project Structure

```
crm-project/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic layer
│   │   ├── routers/         # FastAPI route handlers (thin)
│   │   ├── auth/            # JWT + bcrypt utilities
│   │   ├── main.py          # App factory, middleware, exception handlers
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   └── database.py      # Async SQLAlchemy engine
│   ├── alembic/             # Database migrations
│   ├── seed.py              # Demo data seed script
│   ├── Dockerfile           # Development (with --reload)
│   └── Dockerfile.prod      # Production (multi-stage, 2 workers)
├── frontend/
│   ├── src/
│   │   ├── api/             # axios client + TanStack Query hooks
│   │   ├── components/      # Shared UI, layout, feature components
│   │   ├── pages/           # One file per route
│   │   ├── store/           # Zustand stores (auth, UI)
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile           # Development (Vite HMR)
│   ├── Dockerfile.prod      # Production (multi-stage: build → nginx)
│   └── nginx.conf           # nginx config with React Router SPA fallback
├── docker-compose.yml       # Development compose (volume mounts, HMR)
├── docker-compose.prod.yml  # Production compose (no volume mounts)
└── .env.example             # Environment variable template
```

---

## API Reference

Full interactive documentation is available at **http://localhost:8000/docs** (Swagger UI) and **http://localhost:8000/redoc**.

### Response Envelope

All API responses follow this structure:

```json
{
  "data": { ... },
  "error": null,
  "meta": null
}
```

List endpoints include pagination in `meta`:

```json
{
  "data": [ ... ],
  "error": null,
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login → access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/deals` | List deals (paginated, filterable) |
| POST | `/api/v1/deals` | Create deal |
| PATCH | `/api/v1/deals/{id}/stage` | Move deal stage |
| GET | `/api/v1/reports/dashboard` | KPIs + pipeline summary |
| GET | `/api/v1/settings/team` | List team members (manager/admin) |
| POST | `/api/v1/settings/team/invite` | Invite new user (admin only) |

---

## Production Build

### Test the production build locally

```bash
# Build and run production images
docker compose -f docker-compose.prod.yml up --build

# Frontend is now served by nginx on port 80
# Backend runs with 2 uvicorn workers (no --reload)
```

### Production .env checklist

Before deploying to production, ensure:

- [ ] `SECRET_KEY` is a strong random value (not the dev default)
- [ ] `POSTGRES_PASSWORD` is a strong password
- [ ] `ALLOWED_ORIGINS` includes your production domain (e.g., `https://crm.yourdomain.com`)
- [ ] `VITE_API_BASE_URL` is set to your production backend URL

---

## Deploy to Railway

[Railway](https://railway.app) supports Docker-based deployments.

### Steps

1. **Push to GitHub** — Create a GitHub repository and push this project.

2. **Create a Railway project** — Go to [railway.app](https://railway.app), create a new project, and click **Deploy from GitHub repo**.

3. **Add a PostgreSQL database**:
   - In your Railway project, click **+ New** → **Database** → **PostgreSQL**
   - Copy the connection string (it looks like `postgresql://user:pass@host:5432/db`)
   - Convert it to asyncpg format: `postgresql+asyncpg://user:pass@host:5432/db`

4. **Deploy the backend**:
   - Click **+ New** → **GitHub Repo** → select your repo
   - Set **Root Directory** to `backend`
   - Set **Dockerfile Path** to `Dockerfile.prod`
   - Add environment variables:
     ```
     DATABASE_URL=postgresql+asyncpg://...  (from step 3)
     SECRET_KEY=<strong-random-key>
     ALLOWED_ORIGINS=https://<your-frontend-domain>
     ```
   - Deploy and copy the generated Railway URL (e.g., `https://softcrm-backend.up.railway.app`)

5. **Deploy the frontend**:
   - Click **+ New** → **GitHub Repo** → select your repo
   - Set **Root Directory** to `frontend`
   - Set **Dockerfile Path** to `Dockerfile.prod`
   - Add build argument:
     ```
     VITE_API_BASE_URL=https://<your-backend-domain-from-step-4>
     ```
   - Deploy

6. **Seed initial data** (optional):
   ```bash
   # Using Railway CLI
   railway run python seed.py
   ```

> **Note**: `VITE_API_BASE_URL` is baked into the JavaScript bundle at build time by Vite. If you change your backend URL, you must rebuild and redeploy the frontend.

---

## Role-Based Access Control

| Action | Rep | Manager | Admin |
|---|---|---|---|
| View own deals | ✅ | ✅ | ✅ |
| View all team deals | ❌ | ✅ | ✅ |
| Delete deals | ❌ | ✅ | ✅ |
| View team member list | ❌ | ✅ | ✅ |
| Invite / manage team | ❌ | ❌ | ✅ |
| View all reports | ❌ | team | all |

---

## Pipeline Stages

```
Lead → MQL → Discovery Call → Demo Scheduled → Demo Done
→ Technical Validation → Security Review → Proposal Sent
→ Negotiation → Contract Sent → Won / Lost
```

Designed specifically for software B2B sales cycles.

---

## Development Notes

### Run migrations manually
```bash
docker compose exec backend alembic upgrade head
```

### Connect to the database
```bash
docker compose exec db psql -U crm_user -d softcrm
```

### Run the API smoke test
```bash
pip install requests
python check_apis.py
# Expected: 35 passed | 0 failed
```

### TypeScript type check
```bash
cd frontend && npx tsc --noEmit
```
