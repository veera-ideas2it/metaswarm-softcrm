from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import sqlalchemy as sa
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.company import Company
from app.models.deal import Deal
from app.models.user import User
from app.schemas.dashboard import (
    ClosingSoonDeal,
    DashboardData,
    DealsWonThisMonth,
    RecentActivity,
    StageCount,
)


async def get_dashboard_data(user: User, db: AsyncSession) -> DashboardData:
    now = datetime.now(tz=timezone.utc)
    today = date.today()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    ninety_days_ago = now - timedelta(days=90)
    closing_soon_cutoff = today + timedelta(days=14)

    # -------------------------------------------------------------------------
    # Build base deal filter based on role
    # -------------------------------------------------------------------------
    def _deal_scope(query: sa.Select) -> sa.Select:  # type: ignore[type-arg]
        if user.role == "rep":
            return query.where(Deal.owner_id == user.id)
        # manager and admin both see all deals (simplified per spec)
        return query

    def _activity_scope(query: sa.Select) -> sa.Select:  # type: ignore[type-arg]
        if user.role == "rep":
            return query.where(Activity.user_id == user.id)
        return query

    # -------------------------------------------------------------------------
    # Total pipeline value — open (non-won, non-lost) deals
    # -------------------------------------------------------------------------
    pipeline_q = _deal_scope(
        select(func.coalesce(func.sum(Deal.value), 0.0)).where(
            Deal.deleted_at.is_(None),
            Deal.stage.notin_(["Won", "Lost"]),
        )
    )
    total_pipeline_value: float = float((await db.execute(pipeline_q)).scalar_one())

    # -------------------------------------------------------------------------
    # Deals won this month
    # -------------------------------------------------------------------------
    won_month_q = _deal_scope(
        select(
            func.count(Deal.id).label("count"),
            func.coalesce(func.sum(Deal.value), 0.0).label("value"),
        ).where(
            Deal.deleted_at.is_(None),
            Deal.stage == "Won",
            Deal.closed_at >= start_of_month,
        )
    )
    won_month_row = (await db.execute(won_month_q)).one()
    deals_won_this_month = DealsWonThisMonth(
        count=won_month_row.count,
        value=float(won_month_row.value),
    )

    # -------------------------------------------------------------------------
    # Win rate: won / (won + lost) over last 90 days
    # -------------------------------------------------------------------------
    win_loss_q = _deal_scope(
        select(
            Deal.stage,
            func.count(Deal.id).label("cnt"),
        ).where(
            Deal.deleted_at.is_(None),
            Deal.stage.in_(["Won", "Lost"]),
            Deal.closed_at >= ninety_days_ago,
        ).group_by(Deal.stage)
    )
    win_loss_rows = (await db.execute(win_loss_q)).all()
    won_count = sum(r.cnt for r in win_loss_rows if r.stage == "Won")
    lost_count = sum(r.cnt for r in win_loss_rows if r.stage == "Lost")
    total_closed = won_count + lost_count
    win_rate_percent: float = (won_count / total_closed * 100.0) if total_closed > 0 else 0.0

    # -------------------------------------------------------------------------
    # Avg deal size: average value of won deals over last 90 days
    # -------------------------------------------------------------------------
    avg_q = _deal_scope(
        select(func.coalesce(func.avg(Deal.value), 0.0)).where(
            Deal.deleted_at.is_(None),
            Deal.stage == "Won",
            Deal.closed_at >= ninety_days_ago,
        )
    )
    avg_deal_size: float = float((await db.execute(avg_q)).scalar_one())

    # -------------------------------------------------------------------------
    # Pipeline by stage — open deals
    # -------------------------------------------------------------------------
    stage_q = _deal_scope(
        select(
            Deal.stage,
            func.count(Deal.id).label("count"),
            func.coalesce(func.sum(Deal.value), 0.0).label("value"),
        ).where(
            Deal.deleted_at.is_(None),
            Deal.stage.notin_(["Won", "Lost"]),
        ).group_by(Deal.stage).order_by(Deal.stage)
    )
    stage_rows = (await db.execute(stage_q)).all()
    pipeline_by_stage = [
        StageCount(stage=r.stage, count=r.count, value=float(r.value))
        for r in stage_rows
    ]

    # -------------------------------------------------------------------------
    # Deals closing soon — open deals with expected_close_date <= today + 14 days
    # -------------------------------------------------------------------------
    closing_q = (
        _deal_scope(
            select(Deal)
            .options(
                selectinload(Deal.company),
                selectinload(Deal.owner),
            )
            .where(
                Deal.deleted_at.is_(None),
                Deal.stage.notin_(["Won", "Lost"]),
                Deal.expected_close_date.isnot(None),
                Deal.expected_close_date <= closing_soon_cutoff,
            )
        )
        .order_by(Deal.expected_close_date.asc())
    )
    closing_rows = (await db.execute(closing_q)).scalars().all()
    deals_closing_soon = [
        ClosingSoonDeal(
            id=d.id,
            title=d.title,
            company=d.company.name if d.company else "",
            value=float(d.value) if d.value is not None else None,
            expected_close_date=d.expected_close_date,
            owner=d.owner.full_name if d.owner else "",
        )
        for d in closing_rows
    ]

    # -------------------------------------------------------------------------
    # Recent activities — last 10 ordered by created_at DESC
    # -------------------------------------------------------------------------
    activity_q = (
        _activity_scope(
            select(Activity)
            .options(selectinload(Activity.user))
            .where(Activity.deal_id.isnot(None) | sa.true())
            .order_by(Activity.created_at.desc())
            .limit(10)
        )
    )
    activity_rows = (await db.execute(activity_q)).scalars().all()
    recent_activities = [
        RecentActivity(
            id=a.id,
            type=a.type,
            subject=a.subject,
            deal_id=a.deal_id,
            user={
                "id": str(a.user.id),
                "full_name": a.user.full_name,
                "avatar_url": a.user.avatar_url,
            },
            created_at=a.created_at,
        )
        for a in activity_rows
    ]

    return DashboardData(
        total_pipeline_value=total_pipeline_value,
        deals_won_this_month=deals_won_this_month,
        win_rate_percent=round(win_rate_percent, 1),
        avg_deal_size=round(avg_deal_size, 2),
        pipeline_by_stage=pipeline_by_stage,
        deals_closing_soon=deals_closing_soon,
        recent_activities=recent_activities,
    )
