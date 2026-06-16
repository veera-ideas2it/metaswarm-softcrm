
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse, PaginationParams, Response
from app.schemas.company import CompanyCreate, CompanyListItem, CompanyResponse, CompanyUpdate
from app.services import company as company_service

router = APIRouter(tags=["companies"])


@router.get("/companies", response_model=PaginatedResponse[CompanyListItem])
async def list_companies(
    q: Optional[str] = Query(default=None, description="Search by name or domain"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> PaginatedResponse[CompanyListItem]:
    items, meta = await company_service.get_companies(db=db, pagination=pagination, q=q)
    return PaginatedResponse(data=items, meta=meta)


@router.post("/companies", response_model=Response[CompanyResponse], status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response[CompanyResponse]:
    company = await company_service.create_company(db=db, payload=payload, current_user=current_user)
    await db.commit()
    return Response(data=company)


@router.get("/companies/{company_id}", response_model=Response[CompanyResponse])
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response[CompanyResponse]:
    company = await company_service.get_company(db=db, company_id=company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    return Response(data=company)


@router.patch("/companies/{company_id}", response_model=Response[CompanyResponse])
async def update_company(
    company_id: uuid.UUID,
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response[CompanyResponse]:
    company = await company_service.update_company(db=db, company_id=company_id, payload=payload)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    await db.commit()
    return Response(data=company)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    deleted = await company_service.delete_company(db=db, company_id=company_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    await db.commit()
