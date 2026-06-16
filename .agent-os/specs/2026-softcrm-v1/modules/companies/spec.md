# Module: Companies
# SoftCRM v1

---

## Purpose
Manage companies (accounts) that deals and contacts are associated with.
Track total pipeline ARR, contact headcount, and deal status per company.

---

## Features
- Searchable companies table with ARR, contact count, and deal count
- Company profile with separate Contacts and Deals tabs
- Soft delete

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/companies | Paginated list with search | Bearer |
| POST | /api/v1/companies | Create company | Bearer |
| GET | /api/v1/companies/{id} | Company detail with contacts and deals | Bearer |
| PATCH | /api/v1/companies/{id} | Update company | Bearer |
| DELETE | /api/v1/companies/{id} | Soft delete | Bearer |

**GET /api/v1/companies query params:**
- `q` — search by name or domain (case-insensitive ILIKE)
- `page`, `per_page`, `sort_by`, `sort_order`

---

## UI Requirements

**Companies Page (`/companies`)**
- Search bar: filter by name or domain
- Sortable table columns: Name, Domain, Industry, Size, Contacts Count, Deals Count, Total ARR
- Click row → Company Profile

**Company Profile Page (`/companies/:id`)**
- **Header:** Company name, domain, industry, size badge, website link (opens external)
- **Contacts Tab:** list of contacts at this company — Name, Title, Email, Decision Maker badge
- **Deals Tab:** list of deals linked to this company — Title, Stage badge, Value, Owner, Expected Close Date

---

## Acceptance Criteria
- [ ] Companies table loads with correct column data
- [ ] Search filters by name and domain
- [ ] Total ARR column sums values of open deals for each company
- [ ] Company Profile Contacts tab shows all non-deleted contacts for the company
- [ ] Company Profile Deals tab shows all non-deleted deals for the company
- [ ] Creating a company makes it searchable in deal and contact forms
- [ ] Soft-deleted companies do not appear in the table or search results

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token
- [Module: Contacts](../contacts/spec.md) — contacts listed on Company Profile
- [Module: Deals](../deals/spec.md) — deals listed on Company Profile
- [Database: companies, contacts, deals](../../architecture/database.md)
