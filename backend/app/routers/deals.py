from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityFilters, ActivityResponse
from app.schemas.common import PaginatedResponse, PaginationParams, Response
from app.schemas.deal import (
    DealCreate,
    DealFilters,
    DealListItem,
    DealResponse,
    DealStageUpdate,
    DealUpdate,
    StageHistoryResponse,
)
from app.services import activity as activity_svc
from app.services import deal as deal_svc

router = APIRouter(tags=["deals"])


# ---------------------------------------------------------------------------
# Deals CRUD
# ---------------------------------------------------------------------------

@router.get("/deals", response_model=PaginatedResponse[DealListItem])
async def list_deals(
    owner_id: Optional[uuid.UUID] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    deal_type: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[DealListItem]:
    filters = DealFilters(owner_id=owner_id, stage=stage, deal_type=deal_type)  # type: ignore[arg-type]
    pagination = PaginationParams(
        page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order
    )
    items, meta = await deal_svc.get_deals(filters, pagination, current_user, db)
    return PaginatedResponse(data=items, meta=meta)


@router.post("/deals", response_model=Response[DealResponse], status_code=status.HTTP_201_CREATED)
async def create_deal(
    body: DealCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[DealResponse]:
    deal = await deal_svc.create_deal(body, current_user, db)
    return Response(data=deal)


@router.get("/deals/{deal_id}", response_model=Response[DealResponse])
async def get_deal(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[DealResponse]:
    deal = await deal_svc.get_deal(deal_id, current_user, db)
    return Response(data=deal)


@router.patch("/deals/{deal_id}", response_model=Response[DealResponse])
async def update_deal(
    deal_id: uuid.UUID,
    body: DealUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[DealResponse]:
    deal = await deal_svc.update_deal(deal_id, body, current_user, db)
    return Response(data=deal)


@router.delete("/deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await deal_svc.delete_deal(deal_id, current_user, db)


# ---------------------------------------------------------------------------
# Stage transition
# ---------------------------------------------------------------------------

@router.patch("/deals/{deal_id}/stage", response_model=Response[DealResponse])
async def update_stage(
    deal_id: uuid.UUID,
    body: DealStageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[DealResponse]:
    deal = await deal_svc.update_deal_stage(deal_id, body.stage, current_user, db)
    return Response(data=deal)


# ---------------------------------------------------------------------------
# Activities on a deal
# ---------------------------------------------------------------------------

@router.get("/deals/{deal_id}/activities", response_model=PaginatedResponse[ActivityResponse])
async def list_deal_activities(
    deal_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ActivityResponse]:
    pagination = PaginationParams(
        page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order
    )
    items, meta = await activity_svc.get_activities_for_deal(
        deal_id, pagination, current_user, db
    )
    return PaginatedResponse(data=items, meta=meta)


@router.post(
    "/deals/{deal_id}/activities",
    response_model=Response[ActivityResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_deal_activity(
    deal_id: uuid.UUID,
    body: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[ActivityResponse]:
    activity = await activity_svc.create_activity_on_deal(deal_id, body, current_user, db)
    return Response(data=activity)


# ---------------------------------------------------------------------------
# Stage history
# ---------------------------------------------------------------------------

@router.get("/deals/{deal_id}/stage-history", response_model=Response[list[StageHistoryResponse]])
async def get_stage_history(
    deal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[list[StageHistoryResponse]]:
    history = await deal_svc.get_stage_history(deal_id, current_user, db)
    return Response(data=history)
