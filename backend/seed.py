"""
Seed script for SoftCRM v1.

Run from project root:
    docker compose exec backend python seed.py

Idempotent: checks for admin user before inserting anything.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.auth.password import hash_password
from app.config import settings
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.stage_history import StageHistory
from app.models.user import User

# ---------------------------------------------------------------------------
# Engine / session
# ---------------------------------------------------------------------------

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ---------------------------------------------------------------------------
# Pipeline stages (must match PIPELINE_STAGES constant)
# ---------------------------------------------------------------------------

PIPELINE_STAGES = [
    "Lead",
    "Qualified",
    "Meeting Scheduled",
    "Proposal Sent",
    "Negotiation",
    "Contract Sent",
    "Legal Review",
    "Procurement",
    "Verbal Commit",
    "Closed Won",
    "Closed Lost",
    "On Hold",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _days_ago(n: int) -> datetime:
    return _now() - timedelta(days=n)


# ---------------------------------------------------------------------------
# Main seed
# ---------------------------------------------------------------------------

async def seed() -> None:
    async with AsyncSessionLocal() as db:
        # ----------------------------------------------------------------
        # Idempotency guard
        # ----------------------------------------------------------------
        result = await db.execute(select(User).where(User.email == "admin@softcrm.io"))
        if result.scalar_one_or_none() is not None:
            print("Seed data already present — skipping.")
            return

        print("Seeding database …")

        # ----------------------------------------------------------------
        # Users
        # ----------------------------------------------------------------
        admin = User(
            id=uuid.uuid4(),
            email="admin@softcrm.io",
            full_name="Admin User",
            hashed_password=hash_password("Admin1234!"),
            role="admin",
            is_active=True,
        )
        manager = User(
            id=uuid.uuid4(),
            email="manager@softcrm.io",
            full_name="Manager User",
            hashed_password=hash_password("Manager1234!"),
            role="manager",
            is_active=True,
        )
        rep = User(
            id=uuid.uuid4(),
            email="rep@softcrm.io",
            full_name="Sales Rep",
            hashed_password=hash_password("Rep1234!"),
            role="rep",
            is_active=True,
        )
        db.add_all([admin, manager, rep])
        await db.flush()
        print(f"  Created 3 users: {admin.email}, {manager.email}, {rep.email}")

        # ----------------------------------------------------------------
        # Companies
        # ----------------------------------------------------------------
        acme = Company(
            id=uuid.uuid4(),
            name="Acme Corp",
            domain="acme.com",
            industry="tech",
            size="enterprise",
            website="https://acme.com",
            country="US",
            created_by=admin.id,
        )
        globex = Company(
            id=uuid.uuid4(),
            name="Globex Inc",
            domain="globex.com",
            industry="software",
            size="mid_market",
            website="https://globex.com",
            country="US",
            created_by=manager.id,
        )
        initech = Company(
            id=uuid.uuid4(),
            name="Initech",
            domain="initech.com",
            industry="consulting",
            size="smb",
            website="https://initech.com",
            country="US",
            created_by=rep.id,
        )
        db.add_all([acme, globex, initech])
        await db.flush()
        print(f"  Created 3 companies: {acme.name}, {globex.name}, {initech.name}")

        # ----------------------------------------------------------------
        # Contacts (5 spread across companies)
        # ----------------------------------------------------------------
        contacts_data = [
            dict(
                company_id=acme.id,
                first_name="Alice",
                last_name="Nakamura",
                email="alice@acme.com",
                phone="+1-555-0101",
                title="CTO",
                is_decision_maker=True,
                created_by=admin.id,
            ),
            dict(
                company_id=acme.id,
                first_name="Bob",
                last_name="Smith",
                email="bob@acme.com",
                phone="+1-555-0102",
                title="Procurement Manager",
                is_decision_maker=False,
                created_by=admin.id,
            ),
            dict(
                company_id=globex.id,
                first_name="Carol",
                last_name="Martinez",
                email="carol@globex.com",
                phone="+1-555-0201",
                title="VP Sales",
                is_decision_maker=True,
                created_by=manager.id,
            ),
            dict(
                company_id=globex.id,
                first_name="David",
                last_name="Chen",
                email="david@globex.com",
                phone="+1-555-0202",
                title="Engineering Lead",
                is_decision_maker=False,
                created_by=manager.id,
            ),
            dict(
                company_id=initech.id,
                first_name="Eve",
                last_name="Johnson",
                email="eve@initech.com",
                phone="+1-555-0301",
                title="CEO",
                is_decision_maker=True,
                created_by=rep.id,
            ),
        ]
        contact_objs: list[Contact] = []
        for cd in contacts_data:
            c = Contact(id=uuid.uuid4(), **cd)
            db.add(c)
            contact_objs.append(c)
        await db.flush()
        print(f"  Created {len(contact_objs)} contacts")

        alice, bob, carol, david, eve = contact_objs

        # ----------------------------------------------------------------
        # Deals — 10 deals covering first 10 stages (1 Won, 0 Lost)
        # ----------------------------------------------------------------
        # Stages index 0-9: Lead → Closed Won (index 9)
        # Index 10 = Closed Lost, Index 11 = On Hold
        # We create 10 deals; stages 0-8 each get one, stage 9 (Closed Won) gets 2,
        # satisfying "at least 1 in each of first 10 stages, plus 1 Won, 0 Lost".

        deals_spec = [
            # (title, company, contact, owner, stage_idx, value, deal_type, days_ago_created)
            ("Acme Platform License", acme, alice, admin, 0, 15000.00, "new_business", 30),
            ("Acme Cloud Migration", acme, bob, manager, 1, 45000.00, "new_business", 25),
            ("Acme Support Renewal", acme, alice, rep, 2, 12000.00, "renewal", 22),
            ("Globex CRM Expansion", globex, carol, admin, 3, 30000.00, "expansion", 20),
            ("Globex Analytics Suite", globex, david, manager, 4, 60000.00, "new_business", 18),
            ("Globex API Integration", globex, carol, rep, 5, 8500.00, "expansion", 15),
            ("Initech Consulting Pkg", initech, eve, admin, 6, 22000.00, "new_business", 14),
            ("Initech Data Audit", initech, eve, manager, 7, 9500.00, "new_business", 12),
            ("Initech Retainer 2026", initech, eve, rep, 8, 36000.00, "renewal", 10),
            ("Acme Enterprise Suite", acme, alice, admin, 9, 120000.00, "new_business", 5),
        ]

        deal_objs: list[Deal] = []
        for title, company, contact, owner, stage_idx, value, deal_type, created_days_ago in deals_spec:
            stage = PIPELINE_STAGES[stage_idx]
            is_won = stage == "Closed Won"
            d = Deal(
                id=uuid.uuid4(),
                title=title,
                company_id=company.id,
                primary_contact_id=contact.id,
                owner_id=owner.id,
                stage=stage,
                value=value,
                probability=_stage_probability(stage),
                currency="USD",
                expected_close_date=date.today() + timedelta(days=30 - stage_idx * 2),
                deal_type=deal_type,
                created_at=_days_ago(created_days_ago),
                updated_at=_days_ago(created_days_ago),
                closed_at=_days_ago(1) if is_won else None,
            )
            db.add(d)
            deal_objs.append(d)
        await db.flush()
        print(f"  Created {len(deal_objs)} deals across {len(set(PIPELINE_STAGES[s] for _, _, _, _, s, _, _, _ in deals_spec))} stages")

        # ----------------------------------------------------------------
        # Stage history (initial entry for each deal)
        # ----------------------------------------------------------------
        history_count = 0
        for idx, (d, (title, company, contact, owner, stage_idx, value, deal_type, created_days_ago)) in enumerate(
            zip(deal_objs, deals_spec)
        ):
            # Entry stage: Lead
            sh_initial = StageHistory(
                id=uuid.uuid4(),
                deal_id=d.id,
                from_stage=None,
                to_stage="Lead",
                changed_by=owner.id,
                changed_at=_days_ago(created_days_ago),
                days_in_stage=None,
            )
            db.add(sh_initial)
            history_count += 1

            # Intermediate transitions up to current stage
            for si in range(1, stage_idx + 1):
                days_offset = created_days_ago - si * 2
                sh = StageHistory(
                    id=uuid.uuid4(),
                    deal_id=d.id,
                    from_stage=PIPELINE_STAGES[si - 1],
                    to_stage=PIPELINE_STAGES[si],
                    changed_by=owner.id,
                    changed_at=_days_ago(max(days_offset, 1)),
                    days_in_stage=2,
                )
                db.add(sh)
                history_count += 1

        await db.flush()
        print(f"  Created {history_count} stage_history entries")

        # ----------------------------------------------------------------
        # Commit
        # ----------------------------------------------------------------
        await db.commit()

        print()
        print("=== Seed complete ===")
        print(f"  Users    : 3  (admin / manager / rep)")
        print(f"  Companies: 3  (Acme Corp / Globex Inc / Initech)")
        print(f"  Contacts : {len(contact_objs)}")
        print(f"  Deals    : {len(deal_objs)}")
        print(f"  Stage history entries: {history_count}")
        print()
        print("Credentials:")
        print("  admin@softcrm.io   / Admin1234!")
        print("  manager@softcrm.io / Manager1234!")
        print("  rep@softcrm.io     / Rep1234!")


def _stage_probability(stage: str) -> int:
    mapping = {
        "Lead": 10,
        "Qualified": 20,
        "Meeting Scheduled": 30,
        "Proposal Sent": 40,
        "Negotiation": 50,
        "Contract Sent": 60,
        "Legal Review": 70,
        "Procurement": 75,
        "Verbal Commit": 85,
        "Closed Won": 100,
        "Closed Lost": 0,
        "On Hold": 25,
    }
    return mapping.get(stage, 50)


if __name__ == "__main__":
    asyncio.run(seed())
