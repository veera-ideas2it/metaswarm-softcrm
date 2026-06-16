from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams, Response
from app.schemas.contact import ContactCreate, ContactListItem, ContactResponse, ContactUpdate
from app.services import contact as contact_service

router = APIRouter(tags=["contacts"])


@router.get("/contacts", response_model=PaginatedResponse[ContactListItem])
async def list_contacts(
    q: Optional[str] = Query(default=None, description="Search by name or email"),
    company_id: Optional[uuid.UUID] = Query(default=None, description="Filter by company"),
    is_decision_maker: Optional[bool] = Query(default=None, description="Filter decision makers"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PaginatedResponse[ContactListItem]:
    items, meta = await contact_service.get_contacts(
        db=db,
        pagination=pagination,
        q=q,
        company_id=company_id,
        is_decision_maker=is_decision_maker,
    )
    return PaginatedResponse(data=items, meta=meta)


@router.post("/contacts", response_model=Response[ContactResponse], status_code=status.HTTP_201_CREATED)
async def create_contact(
    payload: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response[ContactResponse]:
    contact = await contact_service.create_contact(db=db, payload=payload, current_user=current_user)
    await db.commit()
    return Response(data=contact)


@router.get("/contacts/{contact_id}", response_model=Response[ContactResponse])
async def get_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response[ContactResponse]:
    contact = await contact_service.get_contact(db=db, contact_id=contact_id)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    return Response(data=contact)


@router.patch("/contacts/{contact_id}", response_model=Response[ContactResponse])
async def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response[ContactResponse]:
    contact = await contact_service.update_contact(db=db, contact_id=contact_id, payload=payload)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    await db.commit()
    return Response(data=contact)


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    deleted = await contact_service.delete_contact(db=db, contact_id=contact_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    await db.commit()
