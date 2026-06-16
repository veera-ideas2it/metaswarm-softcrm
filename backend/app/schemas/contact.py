from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    company_id: uuid.UUID
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    is_decision_maker: bool = False
    linkedin_url: Optional[str] = None


class ContactUpdate(BaseModel):
    company_id: Optional[uuid.UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    is_decision_maker: Optional[bool] = None
    linkedin_url: Optional[str] = None


class ContactDealItem(BaseModel):
    id: uuid.UUID
    title: str
    stage: str
    value: Optional[float] = None

    model_config = {"from_attributes": True}


class ContactActivityItem(BaseModel):
    id: uuid.UUID
    type: str
    subject: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    is_decision_maker: bool
    linkedin_url: Optional[str] = None
    deal_count: int = 0
    last_activity_date: Optional[datetime] = None
    deals: list[ContactDealItem] = []
    activities: list[ContactActivityItem] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContactListItem(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    is_decision_maker: bool
    deal_count: int = 0
    last_activity_date: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
