from __future__ import annotations

import secrets
import string
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.settings import (
    InviteRequest,
    InviteResponse,
    RoleUpdate,
    TeamMemberResponse,
    UserProfileUpdate,
)

_VALID_ROLES = {"admin", "manager", "rep"}


def _generate_temp_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def get_profile(db: AsyncSession, current_user: User) -> UserResponse:
    return UserResponse.model_validate(current_user)


async def update_profile(
    db: AsyncSession,
    current_user: User,
    payload: UserProfileUpdate,
) -> UserResponse:
    # Password change: both fields required together
    if payload.new_password is not None or payload.current_password is not None:
        if payload.current_password is None or payload.new_password is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Both current_password and new_password are required to change password",
            )
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        if len(payload.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="New password must be at least 8 characters",
            )
        current_user.hashed_password = hash_password(payload.new_password)

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    current_user.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


async def get_team(db: AsyncSession) -> list[TeamMemberResponse]:
    result = await db.execute(
        select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.asc())
    )
    users = result.scalars().all()
    return [TeamMemberResponse.model_validate(u) for u in users]


async def invite_member(
    db: AsyncSession,
    payload: InviteRequest,
) -> InviteResponse:
    if payload.role not in _VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(_VALID_ROLES))}",
        )

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    temp_password = _generate_temp_password()
    # Derive a display name from the email local part
    local_part = payload.email.split("@")[0]
    full_name = local_part.replace(".", " ").replace("_", " ").replace("-", " ").title()

    new_user = User(
        email=payload.email,
        full_name=full_name,
        hashed_password=hash_password(temp_password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    return InviteResponse(
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        temp_password=temp_password,
    )


async def change_role(
    db: AsyncSession,
    target_user_id: uuid.UUID,
    payload: RoleUpdate,
    current_user: User,
) -> TeamMemberResponse:
    if payload.role not in _VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role. Must be one of: {', '.join(sorted(_VALID_ROLES))}",
        )

    result = await db.execute(
        select(User).where(User.id == target_user_id, User.deleted_at.is_(None))
    )
    target: User | None = result.scalars().first()

    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Prevent demoting the last admin
    if target.role == "admin" and payload.role != "admin":
        admin_count_result = await db.execute(
            select(User).where(
                User.role == "admin",
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        admins = admin_count_result.scalars().all()
        if len(admins) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last active admin",
            )

    target.role = payload.role
    target.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(target)

    return TeamMemberResponse.model_validate(target)


async def deactivate_user(
    db: AsyncSession,
    target_user_id: uuid.UUID,
    current_user: User,
) -> TeamMemberResponse:
    result = await db.execute(
        select(User).where(User.id == target_user_id, User.deleted_at.is_(None))
    )
    target: User | None = result.scalars().first()

    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    target.is_active = False
    target.updated_at = datetime.now(tz=timezone.utc)
    await db.flush()
    await db.refresh(target)

    return TeamMemberResponse.model_validate(target)
