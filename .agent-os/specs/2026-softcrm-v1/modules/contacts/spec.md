# Module: Contacts
# SoftCRM v1

---

## Purpose
Manage people associated with deals and companies. Track decision-makers,
their linked deals, and interaction history.

---

## Features
- Searchable, filterable contacts table
- Contact profile with linked deals and activity feed
- Decision-maker flag per contact
- Bulk actions: assign to company, delete
- Soft delete

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/contacts | Paginated list with search and filters | Bearer |
| POST | /api/v1/contacts | Create contact | Bearer |
| GET | /api/v1/contacts/{id} | Contact detail with linked deals and recent activities | Bearer |
| PATCH | /api/v1/contacts/{id} | Update contact | Bearer |
| DELETE | /api/v1/contacts/{id} | Soft delete | Bearer |

**GET /api/v1/contacts query params:**
- `q` — search by name or email (case-insensitive ILIKE)
- `company_id` — filter by company
- `is_decision_maker` — boolean filter
- `page`, `per_page`, `sort_by`, `sort_order`

---

## UI Requirements

**Contacts Page (`/contacts`)**
- Search bar: real-time filter by name or email (debounced)
- Filter controls: Company dropdown, Decision Maker toggle
- Sortable table columns: Name, Company, Title, Email, Decision Maker badge, Deals Count, Last Activity date
- Row checkbox for bulk selection
- Bulk action toolbar (appears on selection): Assign to Company, Delete
- Click row → Contact Profile page

**Contact Profile Page (`/contacts/:id`)**
- **Header:** Full name, title, company name (link to Company Profile), email, phone, LinkedIn link (external)
- **Linked Deals:** list with deal title, stage badge, value
- **Activity Feed:** activities related to this contact, ordered chronologically

---

## Acceptance Criteria
- [ ] Contacts table loads with correct column data
- [ ] Name/email search filters results in real time (debounced, not on every keystroke)
- [ ] Decision maker filter shows the correct subset
- [ ] Clicking a row navigates to Contact Profile
- [ ] Contact Profile shows correct linked deals and activity feed
- [ ] Creating a contact adds it to the table immediately
- [ ] Soft-deleted contacts do not appear in the list
- [ ] Bulk delete removes selected contacts (soft delete)

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token
- [Module: Companies](../companies/spec.md) — company search/filter and profile link
- [Module: Activities](../activities/spec.md) — activity feed on Contact Profile
- [Database: contacts, deals, activities](../../architecture/database.md)
