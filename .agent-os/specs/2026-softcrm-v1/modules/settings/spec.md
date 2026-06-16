# Module: Settings
# SoftCRM v1

---

## Purpose
Allow users to manage their own profile and allow admins to manage the team:
invite new members, change roles, and deactivate accounts.

---

## Features
- My Profile: edit name, avatar URL, change password
- Team management (admin only): view all users, invite new member, change role, deactivate user

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/settings/me | Get current user profile | Bearer |
| PATCH | /api/v1/settings/me | Update own name / avatar / password | Bearer |
| GET | /api/v1/settings/team | List all users | Bearer (admin only) |
| POST | /api/v1/settings/team/invite | Create user with temporary password | Bearer (admin only) |
| PATCH | /api/v1/settings/team/{id}/role | Change a user's role | Bearer (admin only) |
| PATCH | /api/v1/settings/team/{id}/deactivate | Set `is_active = false` | Bearer (admin only) |

---

## UI Requirements

**Settings Page (`/settings`)**

**Tabs:**

1. **My Profile**
   - Email field (read-only)
   - Full name field (editable)
   - Avatar URL field (editable)
   - Change Password section: current password, new password, confirm new password
   - Save button with success/error toast feedback

2. **Team** (visible to admin role only)
   - Table columns: Name, Email, Role badge, Status (Active / Inactive), Actions
   - Actions per row: Change Role dropdown (admin / manager / rep), Deactivate button
   - Deactivated users shown with muted styling; no actions available on deactivated rows
   - "Invite Member" button → modal with email + role fields, returns temporary password to admin

---

## Acceptance Criteria
- [ ] User can update their full name and receive a success toast
- [ ] Password change rejects incorrect current password with an error
- [ ] Password change succeeds with correct current password and matching new passwords
- [ ] Team tab is not visible to users with rep or manager roles
- [ ] Admin can invite a new user (user account created with temp password)
- [ ] Admin can change a user's role; new role reflected immediately in the table
- [ ] Admin can deactivate a user; deactivated user cannot log in
- [ ] `GET /auth/me` for a deactivated user returns 401

---

## Dependencies
- [Module: Auth](../auth/spec.md) — Bearer token; admin role enforcement on team endpoints
- [Database: users table](../../architecture/database.md)
- [RBAC roles](../../architecture/rbac.md)
