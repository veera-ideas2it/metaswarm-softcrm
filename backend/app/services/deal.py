from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.deal import Deal
from app.models.stage_history import StageHistory
from app.models.user import User
from app.schemas.common import PaginationMeta, PaginationParams
from app.schemas.deal import (
    PIPELINE_STAGES,
    DealCreate,
    DealFilters,
    DealListItem,
    DealResponse,
    DealUpdate,
    StageHistoryResponse,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_deal_response(deal: Deal) -> DealResponse:
    """Map a Deal ORM object to DealResponse, computing derived fields."""
    company_name = deal.company.name if deal.company else None
    owner_name = deal.owner.full_name if deal.owner else None
    primary_contact_name: str | None = None
    if deal.primary_contact:
        c = deal.primary_contact
        primary_contact_name = f"{c.first_name} {c.last_name}".strip()

    days_in_stage = _compute_days_in_stage(deal)

    return DealResponse(
        id=deal.id,
        title=deal.title,
        company_id=deal.company_id,
        company_name=company_name,
        primary_contact_id=deal.primary_contact_id,
        primary_contact_name=primary_contact_name,
        owner_id=deal.owner_id,
        owner_name=owner_name,
        stage=deal.stage,
        value=deal.value,
        probability=deal.probability,
        currency=deal.currency,
        expected_close_date=deal.expected_close_date,
        product_line=deal.product_line,
        deal_type=deal.deal_type,
        lost_reason=deal.lost_reason,
        days_in_stage=days_in_stage,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        deleted_at=deal.deleted_at,
        closed_at=deal.closed_at,
    )


def _build_deal_list_item(deal: Deal) -> DealListItem:
    company_name = deal.company.name if deal.company else None
    owner_name = deal.owner.full_name if deal.owner else None
    days_in_stage = _compute_days_in_stage(deal)
    return DealListItem(
        id=deal.id,
        title=deal.title,
        company_id=deal.company_id,
        company_name=company_name,
        owner_id=deal.owner_id,
        owner_name=owner_name,
        stage=deal.stage,
        value=deal.value,
        probability=deal.probability,
        currency=deal.currency,
        deal_type=deal.deal_type,
        days_in_stage=days_in_stage,
    )


def _compute_days_in_stage(deal: Deal) -> int | None:
    """Return how many days the deal has been in its current stage."""
    if not deal.stage_history:
        return None
    # Most-recent entry (the current stage)
    last = max(deal.stage_history, key=lambda h: h.changed_at)
    now = datetime.now(tz=timezone.utc)
    changed_at = last.changed_at
    if changed_at.tzinfo is None:
        changed_at = changed_at.replace(tzinfo=timezone.utc)
    return (now - changed_at).days


def _eager_load_options():
    return [
        selectinload(Deal.company),
        selectinload(Deal.owner),
        selectinload(Deal.primary_contact),
        selectinload(Deal.stage_history),
    ]


def _assert_not_deleted(deal: Deal) -> None:
    if deal.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )


def _check_ownership_or_raise(deal: Deal, current_user: User) -> None:
    """Reps can only access their own deals."""
    if current_user.role == "rep" and deal.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

async def get_deals(
    filters: DealFilters,
    pagination: PaginationParams,
    current_user: User,
    db: AsyncSession,
) -> tuple[list[DealListItem], PaginationMeta]:
    """Return a paginated list of deals with RBAC applied."""
    stmt = (
        select(Deal)
        .where(Deal.deleted_at.is_(None))
        .options(*_eager_load_options())
    )

    # RBAC: reps can only see their own deals
    if current_user.role == "rep":
        stmt = stmt.where(Deal.owner_id == current_user.id)
    elif filters.owner_id is not None:
        stmt = stmt.where(Deal.owner_id == filters.owner_id)

    if filters.stage is not None:
        stmt = stmt.where(Deal.stage == filters.stage)
    if filters.deal_type is not None:
        stmt = stmt.where(Deal.deal_type == filters.deal_type)

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await db.execute(count_stmt)).scalar_one()

    # Sort
    sort_col = getattr(Deal, pagination.sort_by, Deal.created_at)
    if pagination.sort_order == "asc":
        stmt = stmt.order_by(sort_col.asc())
    else:
        stmt = stmt.order_by(sort_col.desc())

    stmt = stmt.offset(pagination.offset).limit(pagination.per_page)
    deals = (await db.execute(stmt)).scalars().all()

    items = [_build_deal_list_item(d) for d in deals]
    meta = PaginationMeta.build(total=total, page=pagination.page, per_page=pagination.per_page)
    return items, meta


async def get_deal(
    deal_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> DealResponse:
    """Fetch a single deal with eager-loaded relations."""
    stmt = (
        select(Deal)
        .where(Deal.id == deal_id)
        .options(*_eager_load_options())
    )
    deal: Deal | None = (await db.execute(stmt)).scalars().first()

    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    _assert_not_deleted(deal)
    _check_ownership_or_raise(deal, current_user)

    return _build_deal_response(deal)


async def create_deal(
    data: DealCreate,
    current_user: User,
    db: AsyncSession,
) -> DealResponse:
    """Create a new deal and an initial stage_history entry."""
    owner_id = data.owner_id if data.owner_id is not None else current_user.id

    # Non-reps can assign to others; reps can only own their own deals
    if current_user.role == "rep" and owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reps can only create deals for themselves",
        )

    deal = Deal(
        title=data.title,
        company_id=data.company_id,
        primary_contact_id=data.primary_contact_id,
        owner_id=owner_id,
        value=data.value,
        expected_close_date=data.expected_close_date,
        deal_type=data.deal_type,
        product_line=data.product_line,
        stage="Lead",
    )
    db.add(deal)
    await db.flush()  # get deal.id

    history = StageHistory(
        deal_id=deal.id,
        from_stage=None,
        to_stage="Lead",
        changed_by=current_user.id,
        days_in_stage=None,
    )
    db.add(history)
    await db.commit()

    # Reload with relations
    return await get_deal(deal.id, current_user, db)


async def update_deal(
    deal_id: uuid.UUID,
    data: DealUpdate,
    current_user: User,
    db: AsyncSession,
) -> DealResponse:
    """Update mutable fields on a deal."""
    stmt = select(Deal).where(Deal.id == deal_id).options(*_eager_load_options())
    deal: Deal | None = (await db.execute(stmt)).scalars().first()

    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    _assert_not_deleted(deal)
    _check_ownership_or_raise(deal, current_user)

    # Reps cannot reassign owner
    if data.owner_id is not None and current_user.role == "rep" and data.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reps cannot reassign deal ownership",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deal, field, value)

    await db.commit()
    return await get_deal(deal_id, current_user, db)


async def update_deal_stage(
    deal_id: uuid.UUID,
    new_stage: str,
    current_user: User,
    db: AsyncSession,
) -> DealResponse:
    """Transition a deal to a new pipeline stage."""
    if new_stage not in PIPELINE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid stage '{new_stage}'. Must be one of: {', '.join(PIPELINE_STAGES)}",
        )

    stmt = select(Deal).where(Deal.id == deal_id).options(*_eager_load_options())
    deal: Deal | None = (await db.execute(stmt)).scalars().first()

    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    _assert_not_deleted(deal)
    _check_ownership_or_raise(deal, current_user)

    if deal.stage == new_stage:
        # No-op: already in target stage
        return _build_deal_response(deal)

    # Calculate days_in_stage from the last stage_history entry
    days_in_stage: int | None = None
    if deal.stage_history:
        last = max(deal.stage_history, key=lambda h: h.changed_at)
        now = datetime.now(tz=timezone.utc)
        changed_at = last.changed_at
        if changed_at.tzinfo is None:
            changed_at = changed_at.replace(tzinfo=timezone.utc)
        days_in_stage = (now - changed_at).days

    history = StageHistory(
        deal_id=deal.id,
        from_stage=deal.stage,
        to_stage=new_stage,
        changed_by=current_user.id,
        days_in_stage=days_in_stage,
    )
    db.add(history)

    deal.stage = new_stage

    # Set closed_at when entering Won or Lost
    if new_stage in ("Won", "Lost"):
        deal.closed_at = datetime.now(tz=timezone.utc)
    elif deal.closed_at is not None:
        # Moving out of closed state — clear closed_at
        deal.closed_at = None

    await db.commit()
    return await get_deal(deal_id, current_user, db)


async def delete_deal(
    deal_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> None:
    """Soft delete a deal. Requires manager or admin role."""
    if current_user.role not in ("manager", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can delete deals",
        )

    stmt = select(Deal).where(Deal.id == deal_id)
    deal: Deal | None = (await db.execute(stmt)).scalars().first()

    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    _assert_not_deleted(deal)

    deal.deleted_at = datetime.now(tz=timezone.utc)
    await db.commit()


async def get_stage_history(
    deal_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> list[StageHistoryResponse]:
    """Return the full stage transition history for a deal."""
    stmt = select(Deal).where(Deal.id == deal_id).options(*_eager_load_options())
    deal: Deal | None = (await db.execute(stmt)).scalars().first()

    if deal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    _assert_not_deleted(deal)
    _check_ownership_or_raise(deal, current_user)

    # Eager-load changers for stage_history
    from sqlalchemy.orm import selectinload as _sl
    stmt2 = (
        select(StageHistory)
        .where(StageHistory.deal_id == deal_id)
        .options(_sl(StageHistory.changer))
        .order_by(StageHistory.changed_at.asc())
    )
    rows = (await db.execute(stmt2)).scalars().all()

    return [
        StageHistoryResponse(
            id=h.id,
            deal_id=h.deal_id,
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            changed_by=h.changed_by,
            changed_by_name=h.changer.full_name if h.changer else None,
            changed_at=h.changed_at,
            days_in_stage=h.days_in_stage,
        )
        for h in rows
    ]
