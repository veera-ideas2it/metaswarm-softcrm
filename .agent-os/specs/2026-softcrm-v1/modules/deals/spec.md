# Module: Deals (Deal Detail)
# SoftCRM v1

---

## Purpose
Full deal record management: view and edit all deal fields, track stage progression,
log activities, link contacts, and review the complete stage transition history.

---

## Features
- Inline-editable deal fields
- Clickable stage progression bar across all 12 stages
- Activity logging (call, email, meeting, note, task)
- Contact linking per deal
- Stage history timeline with days-per-stage
- Soft delete (manager/admin only)

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/deals/{id} | Full deal with company, contact, owner | Bearer |
| PATCH | /api/v1/deals/{id} | Update deal fields | Bearer |
| DELETE | /api/v1/deals/{id} | Soft delete deal | Bearer (manager/admin) |
| GET | /api/v1/deals/{id}/activities | Paginated activity list for this deal | Bearer |
| POST | /api/v1/deals/{id}/activities | Log an activity on this deal | Bearer |
| GET | /api/v1/deals/{id}/stage-history | Full stage transition history | Bearer |

---

## UI Requirements

**Deal Detail Page (`/deals/:id`)**

**Header:**
- Deal title — editable inline on click
- Company name — link to Company Profile
- Stage badge
- Value — editable inline
- Expected close date — editable inline

**Stage Progress Bar:**
- Clickable dot for each of the 12 stages
- Current stage dot highlighted
- Completed stages visually distinguished from future stages
- Clicking a dot calls `PATCH /api/v1/deals/{id}/stage`

**Tabs:**

1. **Overview** — deal fields in edit-in-place format:
   - `deal_type`, `product_line`, `probability`, `currency`, `primary_contact`, `owner`
   - `lost_reason` field appears only when stage = `Lost`

2. **Activity** — chronological timeline:
   - Activity entries: type icon, subject, body, timestamp, user
   - Inline log form: type (call / email / meeting / note / task), subject, body, scheduled_at

3. **Contacts** — contacts linked to this deal:
   - List: name, title, decision maker badge
   - "+ Link Contact" button — search/select from existing contacts

4. **Stage History** — transition table:
   - Columns: From Stage, To Stage, Changed By, Date, Days in Stage

---

## Acceptance Criteria
- [ ] Deal detail page loads with all fields populated
- [ ] Inline title edit saves on blur or Enter key
- [ ] Stage progress bar reflects the current stage
- [ ] Clicking a stage dot transitions the deal and updates stage history immediately
- [ ] Activity tab shows all logged activities in chronological order
- [ ] Logging an activity adds it to the timeline without a page reload
- [ ] `lost_reason` field appears when stage is set to Lost
- [ ] Delete deal option is only available to manager/admin roles
- [ ] Stage History tab shows complete history with correct days-in-stage values

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token, role check for delete
- [Module: Pipeline](../pipeline/spec.md) — stage transition logic (shared PATCH /stage)
- [Module: Contacts](../contacts/spec.md) — contact linking and search
- [Module: Companies](../companies/spec.md) — company link in header
- [Module: Activities](../activities/spec.md) — activity logging and timeline
- [Database: deals, activities, stage_history, contacts](../../architecture/database.md)
- [RBAC: delete restricted to manager/admin](../../architecture/rbac.md)
