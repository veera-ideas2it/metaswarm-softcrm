# Architecture: Database Schema
# SoftCRM v1

---

## Pipeline Stages

Ordered stages a deal moves through:

```
1.  Lead
2.  MQL (Marketing Qualified Lead)
3.  Discovery Call
4.  Demo Scheduled
5.  Demo Done
6.  Technical Validation
7.  Security Review
8.  Proposal Sent
9.  Negotiation
10. Contract Sent
11. Won   ← terminal stage (success)
12. Lost  ← terminal stage (failure)
```

---

## Tables

### users
```
id              UUID PK
email           VARCHAR(255) UNIQUE NOT NULL
full_name       VARCHAR(255) NOT NULL
hashed_password TEXT NOT NULL
role            ENUM('admin', 'manager', 'rep') DEFAULT 'rep'
avatar_url      TEXT NULL
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
deleted_at      TIMESTAMPTZ NULL
```

### companies
```
id          UUID PK
name        VARCHAR(255) NOT NULL
domain      VARCHAR(255) NULL
industry    VARCHAR(100) NULL
size        ENUM('startup','smb','mid_market','enterprise') NULL
website     TEXT NULL
country     VARCHAR(100) NULL
created_by  UUID FK → users.id
created_at, updated_at, deleted_at
```

### contacts
```
id                UUID PK
company_id        UUID FK → companies.id
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
email             VARCHAR(255) NULL
phone             VARCHAR(50) NULL
title             VARCHAR(150) NULL
is_decision_maker BOOLEAN DEFAULT false
linkedin_url      TEXT NULL
created_by        UUID FK → users.id
created_at, updated_at, deleted_at
```

### deals
```
id                  UUID PK
title               VARCHAR(255) NOT NULL
company_id          UUID FK → companies.id NOT NULL
primary_contact_id  UUID FK → contacts.id NULL
owner_id            UUID FK → users.id NOT NULL
stage               VARCHAR(50) NOT NULL DEFAULT 'Lead'
value               NUMERIC(12,2) NULL
probability         INTEGER NULL  -- 0-100
currency            VARCHAR(3) DEFAULT 'USD'
expected_close_date DATE NULL
product_line        VARCHAR(100) NULL
deal_type           ENUM('new_business','expansion','renewal') DEFAULT 'new_business'
lost_reason         TEXT NULL
created_at, updated_at, deleted_at
closed_at           TIMESTAMPTZ NULL
```
Indexes: owner_id, stage, company_id, expected_close_date

### activities
```
id           UUID PK
deal_id      UUID FK → deals.id NULL
contact_id   UUID FK → contacts.id NULL
user_id      UUID FK → users.id NOT NULL
type         ENUM('call','email','meeting','note','task') NOT NULL
subject      VARCHAR(255) NOT NULL
body         TEXT NULL
scheduled_at TIMESTAMPTZ NULL
completed_at TIMESTAMPTZ NULL
created_at   TIMESTAMPTZ DEFAULT NOW()
```
Indexes: deal_id, contact_id, user_id

### stage_history
```
id            UUID PK
deal_id       UUID FK → deals.id ON DELETE CASCADE
from_stage    VARCHAR(50) NULL   -- NULL on creation
to_stage      VARCHAR(50) NOT NULL
changed_by    UUID FK → users.id
changed_at    TIMESTAMPTZ DEFAULT NOW()
days_in_stage INTEGER NULL       -- calculated on transition
```
