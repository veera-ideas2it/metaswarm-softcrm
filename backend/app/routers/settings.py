
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.common import Response
from app.schemas.settings import (
    InviteRequest,
    InviteResponse,
    RoleUpdate,
    TeamMemberResponse,
    UserProfileUpdate,
)
from app.services import settings as settings_service

router = APIRouter(tags=["settings"])


@router.get("/settings/me", response_model=Response[UserResponse])
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response[UserResponse]:
    profile = await settings_service.get_profile(db=db, current_user=current_user)
    return Response(data=profile)


@router.patch("/settings/me", response_model=Response[UserResponse])
async def update_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response[UserResponse]:
    profile = await settings_service.update_profile(
        db=db, current_user=current_user, payload=payload
    )
    await db.commit()
    return Response(data=profile)


@router.get(
    "/settings/team",
    response_model=Response[list[TeamMemberResponse]],
    dependencies=[Depends(require_role("admin"))],
)
async def get_team(
    db: AsyncSession = Depends(get_db),
) -> Response[list[TeamMemberResponse]]:
    members = await settings_service.get_team(db=db)
    return Response(data=members)


@router.post(
    "/settings/team",
    response_model=Response[InviteResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
async def invite_member(
    payload: InviteRequest,
    db: AsyncSession = Depends(get_db),
) -> Response[InviteResponse]:
    result = await settings_service.invite_member(db=db, payload=payload)
    await db.commit()
    return Response(data=result)


@router.patch(
    "/settings/team/{user_id}/role",
    response_model=Response[TeamMemberResponse],
    dependencies=[Depends(require_role("admin"))],
)
async def change_role(
    user_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response[TeamMemberResponse]:
    member = await settings_service.change_role(
        db=db,
        target_user_id=user_id,
        payload=payload,
        current_user=current_user,
    )
    await db.commit()
    return Response(data=member)


@router.patch(
    "/settings/team/{user_id}/deactivate",
    response_model=Response[TeamMemberResponse],
    dependencies=[Depends(require_role("admin"))],
)
async def deactivate_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response[TeamMemberResponse]:
    member = await settings_service.deactivate_user(
        db=db,
        target_user_id=user_id,
        current_user=current_user,
    )
    await db.commit()
    return Response(data=member)
