# Spec: SoftCRM v1 — Full Build
# Created: 2026-06
# Status: Ready to build

---

## Overview
Build the complete v1 of SoftCRM — a production-ready sales pipeline CRM
for software companies. React frontend, Python FastAPI backend, PostgreSQL.
All modules listed below must be working and deployable via Docker.

---

## Architecture

| Document | Contents |
|---|---|
| [architecture/database.md](architecture/database.md) | All table definitions, indexes, pipeline stage order |
| [architecture/rbac.md](architecture/rbac.md) | Roles (admin / manager / rep) and permissions matrix |
| [architecture/non-functional.md](architecture/non-functional.md) | Pagination, validation, rate limiting, Docker, migrations, seed data |

---

## Modules

| Module | Spec | Primary Route |
|---|---|---|
| Auth | [modules/auth/spec.md](modules/auth/spec.md) | `/login` |
| Dashboard | [modules/dashboard/spec.md](modules/dashboard/spec.md) | `/dashboard` |
| Pipeline (Kanban) | [modules/pipeline/spec.md](modules/pipeline/spec.md) | `/pipeline` |
| Deals | [modules/deals/spec.md](modules/deals/spec.md) | `/deals/:id` |
| Contacts | [modules/contacts/spec.md](modules/contacts/spec.md) | `/contacts` |
| Companies | [modules/companies/spec.md](modules/companies/spec.md) | `/companies` |
| Activities | [modules/activities/spec.md](modules/activities/spec.md) | `/activities` |
| Settings | [modules/settings/spec.md](modules/settings/spec.md) | `/settings` |

---

## Acceptance Criteria for v1 Complete
- [ ] Sales rep can log in and see their pipeline kanban board
- [ ] Sales rep can drag a deal from one stage to another
- [ ] Sales rep can open a deal and log a call note
- [ ] Manager can see all their team's deals filtered by owner
- [ ] Admin can invite a new team member
- [ ] Dashboard shows correct pipeline value and funnel chart
- [ ] App runs with `docker-compose up --build` in one command
- [ ] All endpoints documented at `/docs` (Swagger)
