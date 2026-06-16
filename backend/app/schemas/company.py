from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CompanyCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None


class CompanyContactItem(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    title: Optional[str] = None
    email: Optional[str] = None
    is_decision_maker: bool

    model_config = {"from_attributes": True}


class CompanyDealItem(BaseModel):
    id: uuid.UUID
    title: str
    stage: str
    value: Optional[float] = None
    owner_name: Optional[str] = None
    expected_close_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    contact_count: int = 0
    deal_count: int = 0
    total_arr: float = 0.0
    contacts: list[CompanyContactItem] = []
    deals: list[CompanyDealItem] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompanyListItem(BaseModel):
    id: uuid.UUID
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    contact_count: int = 0
    deal_count: int = 0
    total_arr: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}
