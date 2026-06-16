# Module: Pipeline (Kanban Board)
# SoftCRM v1

---

## Purpose
Give sales reps a visual drag-and-drop kanban board to manage deals across all
12 pipeline stages. This is the primary daily-use screen for reps.

---

## Features
- 12-column kanban board (one column per pipeline stage)
- Per-column deal count and total value summary
- Deal cards with value, owner avatar, days-in-stage, probability
- Drag-and-drop stage transitions with optimistic UI update
- Filter by owner (manager/admin) and deal type
- Quick deal creation via slide-over form

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/deals | List deals — paginated, filterable | Bearer |
| POST | /api/v1/deals | Create a new deal | Bearer |
| PATCH | /api/v1/deals/{id}/stage | Move deal to a new stage | Bearer |

**GET /api/v1/deals query params:**
- `owner_id` — filter by owner (manager/admin can specify other users; rep restricted to self)
- `stage` — filter by stage
- `deal_type` — filter by deal type (`new_business`, `expansion`, `renewal`)
- `page`, `per_page`, `sort_by`, `sort_order`

**POST /api/v1/deals** — auto-creates a `stage_history` entry with `from_stage = null`.

**PATCH /api/v1/deals/{id}/stage** — creates a `stage_history` entry and calculates `days_in_stage` from last transition timestamp.

---

## UI Requirements

**Pipeline Page (`/pipeline`)**

**Filter Bar (top):**
- Toggle: "My Deals" / "All Deals"
- Owner dropdown (visible to manager/admin only)
- Deal type dropdown (`new_business` / `expansion` / `renewal`)
- "+ Add Deal" button (opens slide-over form)

**Kanban Board:**
- 12 columns, one per pipeline stage, horizontally scrollable
- Each column header: stage name, deal count badge, total value
- Drag-and-drop powered by dnd-kit

**Deal Cards display:**
- Company name (bold)
- Deal title
- Value badge (formatted currency)
- Owner avatar with full-name tooltip
- Days-in-stage pill — turns red when > 14 days
- Probability badge

**Drag Behavior:**
- Dragging a card to a new column immediately moves it (optimistic update)
- `PATCH /api/v1/deals/{id}/stage` called in background
- On API error: revert card to original column and show toast error

**Add Deal Slide-Over Form Fields:**
- `title` (required)
- `company` — search/select or inline create
- `contact` — search/select, filtered by chosen company
- `value`
- `expected_close_date`
- `deal_type`
- `product_line`
- `owner` — visible to manager/admin only, defaults to current user

---

## Acceptance Criteria
- [ ] All 12 stage columns render with correct stage names
- [ ] Deals appear in their correct stage column
- [ ] Dragging a deal to a new column updates its stage in the database
- [ ] Optimistic update reverts to original column on API failure
- [ ] Column deal count and total value update after a drag
- [ ] Days-in-stage pill turns red after 14 days
- [ ] "My Deals" toggle shows only the current user's deals
- [ ] "+ Add Deal" creates a deal and it appears in the Lead column
- [ ] Rep cannot view other users' deals via "All Deals"

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token, role enforcement
- [Module: Deals](../deals/spec.md) — shared deal data model and stage transition logic
- [Database: deals, stage_history](../../architecture/database.md)
- [RBAC permissions matrix](../../architecture/rbac.md)
- dnd-kit (frontend drag-and-drop)
