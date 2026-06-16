# Module: Activities
# SoftCRM v1

---

## Purpose
Log and track all sales interactions — calls, emails, meetings, notes, and tasks —
across deals and contacts. Provides a unified activity log for the whole team.

---

## Features
- Five activity types: `call`, `email`, `meeting`, `note`, `task`
- Activities linked to a deal and/or a contact
- Standalone activities (no deal link required)
- Task completion tracking with inline checkbox
- Filterable team activity log

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/activities | Paginated list with filters | Bearer |
| POST | /api/v1/activities | Create standalone activity | Bearer |
| PATCH | /api/v1/activities/{id} | Update activity (mark complete, edit note) | Bearer |
| DELETE | /api/v1/activities/{id} | Delete activity | Bearer |

**GET /api/v1/activities query params:**
- `type` — filter by activity type (`call`, `email`, `meeting`, `note`, `task`)
- `user_id` — filter by owner
- `deal_id` — filter by deal
- `date_from`, `date_to` — date range filter
- `page`, `per_page`, `sort_by`, `sort_order`

**Note:** Activities can also be created and listed via deal-scoped endpoints:
- `POST /api/v1/deals/{id}/activities`
- `GET /api/v1/deals/{id}/activities`

See [Module: Deals](../deals/spec.md) for deal-scoped usage.

---

## UI Requirements

**Activities Page (`/activities`)**
- Toggle: "My Activities" / "All Activities"
- Filter bar: Type (multi-select), Owner dropdown, Date range picker
- Table columns: Type Icon, Subject, Linked Deal (clickable link), Linked Contact (clickable link), Owner, Date/Time
- Task completion: inline checkbox per row for `task` type — clicking calls `PATCH` to set `completed_at`
- Completed tasks visually distinguished (strikethrough text, muted styling)
- Click row to expand `body` text inline without navigation

---

## Acceptance Criteria
- [ ] Activities page loads all activities visible to the current user's role
- [ ] Type filter correctly shows the selected subset
- [ ] Date range filter returns only activities within the specified window
- [ ] Task checkbox marks the task complete (sets `completed_at`) and updates styling
- [ ] Completed tasks are visually distinguished from open tasks
- [ ] Linked deal and contact cells are clickable and navigate to the correct profiles
- [ ] Creating a standalone activity appears in the list immediately

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token
- [Module: Deals](../deals/spec.md) — deal-scoped activity endpoints
- [Module: Contacts](../contacts/spec.md) — contact link displayed in activity rows
- [Database: activities, deals, contacts](../../architecture/database.md)
