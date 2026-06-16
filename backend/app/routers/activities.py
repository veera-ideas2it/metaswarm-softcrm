from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.activity import (
    ActivityCreate,
    ActivityFilters,
    ActivityResponse,
    ActivityUpdate,
)
from app.schemas.common import PaginatedResponse, PaginationParams, Response
from app.services import activity as activity_svc
from datetime import datetime

router = APIRouter(tags=["activities"])


@router.get("/activities", response_model=PaginatedResponse[ActivityResponse])
async def list_activities(
    type: Optional[str] = Query(default=None),
    user_id: Optional[uuid.UUID] = Query(default=None),
    deal_id: Optional[uuid.UUID] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=200),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ActivityResponse]:
    filters = ActivityFilters(
        type=type,  # type: ignore[arg-type]
        user_id=user_id,
        deal_id=deal_id,
        date_from=date_from,
        date_to=date_to,
    )
    pagination = PaginationParams(
        page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order
    )
    items, meta = await activity_svc.get_activities(filters, pagination, current_user, db)
    return PaginatedResponse(data=items, meta=meta)


@router.post(
    "/activities",
    response_model=Response[ActivityResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    body: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[ActivityResponse]:
    activity = await activity_svc.create_activity(body, current_user, db)
    return Response(data=activity)


@router.patch("/activities/{activity_id}", response_model=Response[ActivityResponse])
async def update_activity(
    activity_id: uuid.UUID,
    body: ActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[ActivityResponse]:
    activity = await activity_svc.update_activity(activity_id, body, current_user, db)
    return Response(data=activity)


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await activity_svc.delete_activity(activity_id, current_user, db)
