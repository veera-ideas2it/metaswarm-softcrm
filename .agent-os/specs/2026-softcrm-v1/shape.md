# Shape Context
# SoftCRM v1 — Decisions made during spec shaping

## Why these pipeline stages?
Software sales has unique stages that generic CRMs miss. "Technical Validation"
and "Security Review" are real blockers in enterprise software sales — deals
sit there for weeks. Tracking them separately lets managers spot stuck deals
early. "MQL" is included because most software companies have a marketing team
handing leads to sales.

## Why minimal modules for v1?
The acceptance criteria is: can a rep use this on day 1?
That requires pipeline, deals, contacts, companies, activities, and auth.
Reporting and settings are included because without them, the admin can't
set up the team and the manager can't see the overview.
Everything else (email sync, calendar, custom fields) is v2.

## Why soft deletes everywhere?
Sales data is audit-sensitive. Hard deletes cause confusion ("where did that
deal go?"). Soft deletes let admins recover data and maintain accurate
historical reporting.

## Why UUID primary keys?
Integer IDs expose record counts (deal id=5 tells a competitor you have 5 deals).
UUIDs are safe to expose in URLs and API responses.

## Why RBAC with 3 roles only?
More roles = more confusion during onboarding. Admin/Manager/Rep covers 95%
of software sales team structures. Custom roles is a v3 feature.

## Frontend tech choices
- dnd-kit over react-beautiful-dnd: rbd is deprecated, dnd-kit is actively maintained
- TanStack Query over SWR: better devtools, more features, same bundle size
- Zustand over Redux: far less boilerplate, sufficient for our state complexity
- Recharts over Chart.js: native React components, easier to customize

## Deferred decisions
- Email: needs SMTP config, OAuth scopes, threading logic — v2
- File attachments: needs S3/blob storage setup — v2
- Custom pipeline stages: configurable stages adds significant complexity — v2
