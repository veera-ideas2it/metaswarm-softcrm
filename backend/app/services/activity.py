from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import (
    ActivityCreate,
    ActivityFilters,
    ActivityResponse,
    ActivityUpdate,
)
from app.schemas.common import PaginationMeta, PaginationParams


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_activity_response(activity: Activity) -> ActivityResponse:
    user_name = activity.user.full_name if activity.user else None
    deal_title: str | None = None
    if activity.deal:
        deal_title = activity.deal.title
    contact_name: str | None = None
    if activity.contact:
        c = activity.contact
        contact_name = f"{c.first_name} {c.last_name}".strip()

    return ActivityResponse(
        id=activity.id,
        deal_id=activity.deal_id,
        deal_title=deal_title,
        contact_id=activity.contact_id,
        contact_name=contact_name,
        user_id=activity.user_id,
        user_name=user_name,
        type=activity.type,
        subject=activity.subject,
        body=activity.body,
        scheduled_at=activity.scheduled_at,
        completed_at=activity.completed_at,
        created_at=activity.created_at,
    )


def _eager_options():
    return [
        selectinload(Activity.user),
        selectinload(Activity.deal),
        selectinload(Activity.contact),
    ]


def _check_ownership_or_raise(activity: Activity, current_user: User) -> None:
    if current_user.role == "rep" and activity.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


# ---------------------------------------------------------------------------
# Service functions
# ---------------------------------------------------------------------------

async def get_activities(
    filters: ActivityFilters,
    pagination: PaginationParams,
    current_user: User,
    db: AsyncSession,
) -> tuple[list[ActivityResponse], PaginationMeta]:
    """Return a paginated list of activities with RBAC applied."""
    stmt = select(Activity).options(*_eager_options())

    # RBAC: reps only see their own activities
    if current_user.role == "rep":
        stmt = stmt.where(Activity.user_id == current_user.id)
    elif filters.user_id is not None:
        stmt = stmt.where(Activity.user_id == filters.user_id)

    if filters.type is not None:
        stmt = stmt.where(Activity.type == filters.type)
    if filters.deal_id is not None:
        stmt = stmt.where(Activity.deal_id == filters.deal_id)
    if filters.date_from is not None:
        stmt = stmt.where(Activity.created_at >= filters.date_from)
    if filters.date_to is not None:
        stmt = stmt.where(Activity.created_at <= filters.date_to)

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total: int = (await db.execute(count_stmt)).scalar_one()

    # Sort
    sort_col = getattr(Activity, pagination.sort_by, Activity.created_at)
    if pagination.sort_order == "asc":
        stmt = stmt.order_by(sort_col.asc())
    else:
        stmt = stmt.order_by(sort_col.desc())

    stmt = stmt.offset(pagination.offset).limit(pagination.per_page)
    activities = (await db.execute(stmt)).scalars().all()

    items = [_build_activity_response(a) for a in activities]
    meta = PaginationMeta.build(total=total, page=pagination.page, per_page=pagination.per_page)
    return items, meta


async def get_activities_for_deal(
    deal_id: uuid.UUID,
    pagination: PaginationParams,
    current_user: User,
    db: AsyncSession,
) -> tuple[list[ActivityResponse], PaginationMeta]:
    """Return paginated activities for a specific deal."""
    filters = ActivityFilters(deal_id=deal_id)
    return await get_activities(filters, pagination, current_user, db)


async def create_activity(
    data: ActivityCreate,
    current_user: User,
    db: AsyncSession,
) -> ActivityResponse:
    """Create an activity linked to the current user."""
    activity = Activity(
        deal_id=data.deal_id,
        contact_id=data.contact_id,
        user_id=current_user.id,
        type=data.type,
        subject=data.subject,
        body=data.body,
        scheduled_at=data.scheduled_at,
    )
    db.add(activity)
    await db.commit()

    # Reload with relations
    stmt = (
        select(Activity)
        .where(Activity.id == activity.id)
        .options(*_eager_options())
    )
    reloaded = (await db.execute(stmt)).scalars().first()
    return _build_activity_response(reloaded)  # type: ignore[arg-type]


async def create_activity_on_deal(
    deal_id: uuid.UUID,
    data: ActivityCreate,
    current_user: User,
    db: AsyncSession,
) -> ActivityResponse:
    """Create an activity, forcing it onto a specific deal."""
    data_with_deal = data.model_copy(update={"deal_id": deal_id})
    return await create_activity(data_with_deal, current_user, db)


async def update_activity(
    activity_id: uuid.UUID,
    data: ActivityUpdate,
    current_user: User,
    db: AsyncSession,
) -> ActivityResponse:
    """Update an activity. Reps can only edit their own."""
    stmt = (
        select(Activity)
        .where(Activity.id == activity_id)
        .options(*_eager_options())
    )
    activity: Activity | None = (await db.execute(stmt)).scalars().first()

    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    _check_ownership_or_raise(activity, current_user)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)

    await db.commit()

    # Reload
    reloaded = (await db.execute(stmt)).scalars().first()
    return _build_activity_response(reloaded)  # type: ignore[arg-type]


async def delete_activity(
    activity_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> None:
    """Delete an activity. Reps can only delete their own; managers/admins can delete any."""
    stmt = select(Activity).where(Activity.id == activity_id)
    activity: Activity | None = (await db.execute(stmt)).scalars().first()

    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    _check_ownership_or_raise(activity, current_user)

    await db.delete(activity)
    await db.commit()
