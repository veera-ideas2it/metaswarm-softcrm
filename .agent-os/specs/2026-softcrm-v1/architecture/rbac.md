# Architecture: Role-Based Access Control
# SoftCRM v1

---

## Roles

- **admin** — full access, manages team
- **manager** — sees team deals and reports, can delete deals
- **rep** — sees own deals only

---

## Permissions Matrix

| Action | Rep | Manager | Admin |
|---|---|---|---|
| View own deals | ✅ | ✅ | ✅ |
| View team deals | ❌ | ✅ | ✅ |
| View all deals | ❌ | ❌ | ✅ |
| Create/edit own deals | ✅ | ✅ | ✅ |
| Delete deals | ❌ | ✅ | ✅ |
| View reports | own | team | all |
| Manage team (invite/role) | ❌ | ❌ | ✅ |
