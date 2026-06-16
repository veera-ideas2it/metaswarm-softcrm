from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

import sqlalchemy as sa
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User
from app.schemas.common import PaginationMeta, PaginationParams
from app.schemas.contact import (
    ContactActivityItem,
    ContactCreate,
    ContactDealItem,
    ContactListItem,
    ContactResponse,
    ContactUpdate,
)


async def get_contacts(
    db: AsyncSession,
    pagination: PaginationParams,
    q: Optional[str] = None,
    company_id: Optional[uuid.UUID] = None,
    is_decision_maker: Optional[bool] = None,
) -> tuple[list[ContactListItem], PaginationMeta]:
    # Base filter: not soft-deleted
    filters: list = [Contact.deleted_at.is_(None)]

    if q:
        pattern = f"%{q}%"
        filters.append(
            sa.or_(
                Contact.first_name.ilike(pattern),
                Contact.last_name.ilike(pattern),
                (Contact.first_name + " " + Contact.last_name).ilike(pattern),
                Contact.email.ilike(pattern),
            )
        )

    if company_id is not None:
        filters.append(Contact.company_id == company_id)

    if is_decision_maker is not None:
        filters.append(Contact.is_decision_maker == is_decision_maker)

    # Count total
    count_q = select(func.count(Contact.id)).where(*filters)
    total: int = (await db.execute(count_q)).scalar_one()

    # Subquery: deal count per contact
    deal_count_sq = (
        select(Deal.primary_contact_id, func.count(Deal.id).label("deal_count"))
        .where(Deal.deleted_at.is_(None))
        .group_by(Deal.primary_contact_id)
        .subquery()
    )

    # Subquery: last activity date per contact
    last_activity_sq = (
        select(
            Activity.contact_id,
            func.max(Activity.created_at).label("last_activity_date"),
        )
        .group_by(Activity.contact_id)
        .subquery()
    )

    # Resolve sort column
    _sort_columns: dict[str, sa.Column] = {  # type: ignore[type-arg]
        "first_name": Contact.first_name,
        "last_name": Contact.last_name,
        "email": Contact.email,
        "created_at": Contact.created_at,
        "updated_at": Contact.updated_at,
    }
    sort_col = _sort_columns.get(pagination.sort_by, Contact.created_at)
    order_expr = sort_col.asc() if pagination.sort_order == "asc" else sort_col.desc()

    stmt = (
        select(
            Contact,
            Company.name.label("company_name"),
            func.coalesce(deal_count_sq.c.deal_count, 0).label("deal_count"),
            last_activity_sq.c.last_activity_date,
        )
        .join(Company, Contact.company_id == Company.id, isouter=True)
        .join(
            deal_count_sq,
            Contact.id == deal_count_sq.c.primary_contact_id,
            isouter=True,
        )
        .join(
            last_activity_sq,
            Contact.id == last_activity_sq.c.contact_id,
            isouter=True,
        )
        .where(*filters)
        .order_by(order_expr)
        .offset(pagination.offset)
        .limit(pagination.per_page)
    )

    rows = (await db.execute(stmt)).all()

    items = [
        ContactListItem(
            id=row.Contact.id,
            company_id=row.Contact.company_id,
            company_name=row.company_name,
            first_name=row.Contact.first_name,
            last_name=row.Contact.last_name,
            email=row.Contact.email,
            phone=row.Contact.phone,
            title=row.Contact.title,
            is_decision_maker=row.Contact.is_decision_maker,
            deal_count=row.deal_count,
            last_activity_date=row.last_activity_date,
            created_at=row.Contact.created_at,
        )
        for row in rows
    ]

    meta = PaginationMeta.build(total=total, page=pagination.page, per_page=pagination.per_page)
    return items, meta


async def create_contact(
    db: AsyncSession,
    payload: ContactCreate,
    current_user: User,
) -> ContactResponse:
    contact = Contact(
        company_id=payload.company_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        title=payload.title,
        is_decision_maker=payload.is_decision_maker,
        linkedin_url=payload.linkedin_url,
        created_by=current_user.id,
    )
    db.add(contact)
    await db.flush()
    await db.refresh(contact)

    # Fetch company name
    company_result = await db.execute(
        select(Company.name).where(Company.id == contact.company_id)
    )
    company_name: str | None = company_result.scalar_one_or_none()

    return ContactResponse(
        id=contact.id,
        company_id=contact.company_id,
        company_name=company_name,
        first_name=contact.first_name,
        last_name=contact.last_name,
        email=contact.email,
        phone=contact.phone,
        title=contact.title,
        is_decision_maker=contact.is_decision_maker,
        linkedin_url=contact.linkedin_url,
        deal_count=0,
        last_activity_date=None,
        deals=[],
        activities=[],
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


async def get_contact(db: AsyncSession, contact_id: uuid.UUID) -> ContactResponse | None:
    stmt = (
        select(Contact)
        .options(
            selectinload(Contact.company),
            selectinload(Contact.deals_as_primary),
            selectinload(Contact.activities),
        )
        .where(Contact.id == contact_id, Contact.deleted_at.is_(None))
    )
    result = await db.execute(stmt)
    contact: Contact | None = result.scalars().first()

    if contact is None:
        return None

    # Filter non-deleted deals
    open_deals = [d for d in contact.deals_as_primary if d.deleted_at is None]

    # Last activity date
    activity_dates = [a.created_at for a in contact.activities]
    last_activity_date: datetime | None = max(activity_dates) if activity_dates else None

    deals_out = [
        ContactDealItem(
            id=d.id,
            title=d.title,
            stage=d.stage,
            value=float(d.value) if d.value is not None else None,
        )
        for d in open_deals
    ]

    activities_sorted = sorted(contact.activities, key=lambda a: a.created_at)
    activities_out = [
        ContactActivityItem(
            id=a.id,
            type=a.type,
            subject=a.subject,
            created_at=a.created_at,
        )
        for a in activities_sorted
    ]

    return ContactResponse(
        id=contact.id,
        company_id=contact.company_id,
        company_name=contact.company.name if contact.company else None,
        first_name=contact.first_name,
        last_name=contact.last_name,
        email=contact.email,
        phone=contact.phone,
        title=contact.title,
        is_decision_maker=contact.is_decision_maker,
        linkedin_url=contact.linkedin_url,
        deal_count=len(open_deals),
        last_activity_date=last_activity_date,
        deals=deals_out,
        activities=activities_out,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


async def update_contact(
    db: AsyncSession,
    contact_id: uuid.UUID,
    payload: ContactUpdate,
) -> ContactResponse | None:
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.deleted_at.is_(None))
    )
    contact: Contact | None = result.scalars().first()

    if contact is None:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)

    contact.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(contact)

    return await get_contact(db, contact_id)


async def delete_contact(db: AsyncSession, contact_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Contact).where(Contact.id == contact_id, Contact.deleted_at.is_(None))
    )
    contact: Contact | None = result.scalars().first()

    if contact is None:
        return False

    contact.deleted_at = datetime.now(tz=timezone.utc)
    await db.flush()
    return True
