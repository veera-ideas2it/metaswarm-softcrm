from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

import sqlalchemy as sa
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User
from app.schemas.common import PaginationMeta, PaginationParams
from app.schemas.company import (
    CompanyContactItem,
    CompanyCreate,
    CompanyDealItem,
    CompanyListItem,
    CompanyResponse,
    CompanyUpdate,
)

# Stages that are considered "open" for ARR calculation
_CLOSED_STAGES = ("Won", "Lost")


async def get_companies(
    db: AsyncSession,
    pagination: PaginationParams,
    q: Optional[str] = None,
) -> tuple[list[CompanyListItem], PaginationMeta]:
    filters: list = [Company.deleted_at.is_(None)]

    if q:
        pattern = f"%{q}%"
        filters.append(
            sa.or_(
                Company.name.ilike(pattern),
                Company.domain.ilike(pattern),
            )
        )

    # Count
    count_q = select(func.count(Company.id)).where(*filters)
    total: int = (await db.execute(count_q)).scalar_one()

    # Subquery: contact count per company
    contact_count_sq = (
        select(Contact.company_id, func.count(Contact.id).label("contact_count"))
        .where(Contact.deleted_at.is_(None))
        .group_by(Contact.company_id)
        .subquery()
    )

    # Subquery: deal count and total ARR per company
    deal_stats_sq = (
        select(
            Deal.company_id,
            func.count(Deal.id).label("deal_count"),
            func.coalesce(
                func.sum(
                    sa.case(
                        (Deal.stage.notin_(list(_CLOSED_STAGES)), Deal.value),
                        else_=sa.literal(0),
                    )
                ),
                0,
            ).label("total_arr"),
        )
        .where(Deal.deleted_at.is_(None))
        .group_by(Deal.company_id)
        .subquery()
    )

    _sort_columns: dict[str, sa.Column] = {  # type: ignore[type-arg]
        "name": Company.name,
        "domain": Company.domain,
        "industry": Company.industry,
        "created_at": Company.created_at,
        "updated_at": Company.updated_at,
    }
    sort_col = _sort_columns.get(pagination.sort_by, Company.created_at)
    order_expr = sort_col.asc() if pagination.sort_order == "asc" else sort_col.desc()

    stmt = (
        select(
            Company,
            func.coalesce(contact_count_sq.c.contact_count, 0).label("contact_count"),
            func.coalesce(deal_stats_sq.c.deal_count, 0).label("deal_count"),
            func.coalesce(deal_stats_sq.c.total_arr, 0).label("total_arr"),
        )
        .join(
            contact_count_sq,
            Company.id == contact_count_sq.c.company_id,
            isouter=True,
        )
        .join(
            deal_stats_sq,
            Company.id == deal_stats_sq.c.company_id,
            isouter=True,
        )
        .where(*filters)
        .order_by(order_expr)
        .offset(pagination.offset)
        .limit(pagination.per_page)
    )

    rows = (await db.execute(stmt)).all()

    items = [
        CompanyListItem(
            id=row.Company.id,
            name=row.Company.name,
            domain=row.Company.domain,
            industry=row.Company.industry,
            size=row.Company.size,
            contact_count=row.contact_count,
            deal_count=row.deal_count,
            total_arr=float(row.total_arr),
            created_at=row.Company.created_at,
        )
        for row in rows
    ]

    meta = PaginationMeta.build(total=total, page=pagination.page, per_page=pagination.per_page)
    return items, meta


async def create_company(
    db: AsyncSession,
    payload: CompanyCreate,
    current_user: User,
) -> CompanyResponse:
    company = Company(
        name=payload.name,
        domain=payload.domain,
        industry=payload.industry,
        size=payload.size,
        website=payload.website,
        country=payload.country,
        created_by=current_user.id,
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)

    return CompanyResponse(
        id=company.id,
        name=company.name,
        domain=company.domain,
        industry=company.industry,
        size=company.size,
        website=company.website,
        country=company.country,
        contact_count=0,
        deal_count=0,
        total_arr=0.0,
        contacts=[],
        deals=[],
        created_at=company.created_at,
        updated_at=company.updated_at,
    )


async def get_company(db: AsyncSession, company_id: uuid.UUID) -> CompanyResponse | None:
    stmt = (
        select(Company)
        .options(
            selectinload(Company.contacts),
            selectinload(Company.deals).selectinload(Deal.owner),
        )
        .where(Company.id == company_id, Company.deleted_at.is_(None))
    )
    result = await db.execute(stmt)
    company: Company | None = result.scalars().first()

    if company is None:
        return None

    active_contacts = [c for c in company.contacts if c.deleted_at is None]
    active_deals = [d for d in company.deals if d.deleted_at is None]

    total_arr = sum(
        float(d.value)
        for d in active_deals
        if d.stage not in _CLOSED_STAGES and d.value is not None
    )

    contacts_out = [
        CompanyContactItem(
            id=c.id,
            first_name=c.first_name,
            last_name=c.last_name,
            title=c.title,
            email=c.email,
            is_decision_maker=c.is_decision_maker,
        )
        for c in active_contacts
    ]

    deals_out = [
        CompanyDealItem(
            id=d.id,
            title=d.title,
            stage=d.stage,
            value=float(d.value) if d.value is not None else None,
            owner_name=d.owner.full_name if d.owner else None,
            expected_close_date=d.expected_close_date,
        )
        for d in active_deals
    ]

    return CompanyResponse(
        id=company.id,
        name=company.name,
        domain=company.domain,
        industry=company.industry,
        size=company.size,
        website=company.website,
        country=company.country,
        contact_count=len(active_contacts),
        deal_count=len(active_deals),
        total_arr=total_arr,
        contacts=contacts_out,
        deals=deals_out,
        created_at=company.created_at,
        updated_at=company.updated_at,
    )


async def update_company(
    db: AsyncSession,
    company_id: uuid.UUID,
    payload: CompanyUpdate,
) -> CompanyResponse | None:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.deleted_at.is_(None))
    )
    company: Company | None = result.scalars().first()

    if company is None:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    company.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()

    return await get_company(db, company_id)


async def delete_company(db: AsyncSession, company_id: uuid.UUID) -> bool:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.deleted_at.is_(None))
    )
    company: Company | None = result.scalars().first()

    if company is None:
        return False

    company.deleted_at = datetime.now(tz=timezone.utc)
    await db.flush()
    return True
