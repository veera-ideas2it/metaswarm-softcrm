# Module: Dashboard
# SoftCRM v1

---

## Purpose
Give sales managers and reps an at-a-glance view of pipeline health, recent
activity, and deals requiring immediate attention.

---

## Features
- 4 KPI summary cards (pipeline value, won this month, win rate, avg deal size)
- Pipeline funnel chart by stage (deal count per stage)
- Deals closing within 14 days table
- Team activity feed (last 10 activities)
- Data scoped by role: rep sees own, manager sees team, admin sees all

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/reports/dashboard | Aggregated dashboard data | Bearer |

**Response payload:**
```json
{
  "total_pipeline_value": 0.00,
  "deals_won_this_month": { "count": 0, "value": 0.00 },
  "win_rate_percent": 0.0,
  "avg_deal_size": 0.00,
  "pipeline_by_stage": [{ "stage": "", "count": 0, "value": 0.00 }],
  "deals_closing_soon": [
    { "id": "", "title": "", "company": "", "value": 0.00, "expected_close_date": "", "owner": "" }
  ],
  "recent_activities": [
    { "id": "", "type": "", "subject": "", "deal_id": "", "user": {}, "created_at": "" }
  ]
}
```

**Calculation rules:**
- `win_rate_percent`: won / (won + lost) over last 90 days
- `avg_deal_size`: average value of won deals over last 90 days
- `deals_closing_soon`: open deals with `expected_close_date ≤ today + 14 days`
- `recent_activities`: last 10 activities ordered by `created_at DESC`

---

## UI Requirements

**Dashboard Page (`/` or `/dashboard`)**

- **4 KPI Cards** (top row): Pipeline Value | Won This Month | Win Rate | Avg Deal Size
- **Pipeline Funnel Chart**: Recharts `BarChart`, one bar per stage, shows deal count per stage
- **Closing Soon Table**: columns — Deal Title, Company, Value, Close Date, Owner
- **Activity Feed**: type icon, subject, linked deal (clickable), relative timestamp, user avatar

Layout: KPI cards top row, chart and closing-soon table side by side below, activity feed full-width at bottom.

---

## Acceptance Criteria
- [ ] Dashboard loads and displays all 4 KPI cards with correct values
- [ ] Pipeline chart shows correct deal count per stage
- [ ] Closing soon table shows only open deals within 14 days, sorted by close date ascending
- [ ] Activity feed shows the last 10 team activities
- [ ] Rep sees only their own data; manager sees team data; admin sees all
- [ ] Empty state handled gracefully when no deals exist

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token required
- [Database: deals, activities, stage_history](../../architecture/database.md)
- [RBAC permissions matrix](../../architecture/rbac.md)
- Recharts (frontend charting)
