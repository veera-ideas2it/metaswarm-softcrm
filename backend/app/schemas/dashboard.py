from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class StageCount(BaseModel):
    stage: str
    count: int
    value: float


class ClosingSoonDeal(BaseModel):
    id: uuid.UUID
    title: str
    company: str
    value: float | None
    expected_close_date: date | None
    owner: str

    model_config = {"from_attributes": True}


class RecentActivity(BaseModel):
    id: uuid.UUID
    type: str
    subject: str
    deal_id: uuid.UUID | None
    user: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class DealsWonThisMonth(BaseModel):
    count: int
    value: float


class DashboardData(BaseModel):
    total_pipeline_value: float
    deals_won_this_month: DealsWonThisMonth
    win_rate_percent: float
    avg_deal_size: float
    pipeline_by_stage: list[StageCount]
    deals_closing_soon: list[ClosingSoonDeal]
    recent_activities: list[RecentActivity]
