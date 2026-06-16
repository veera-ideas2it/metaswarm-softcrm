from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


PIPELINE_STAGES = [
    "Lead",
    "MQL",
    "Discovery Call",
    "Demo Scheduled",
    "Demo Done",
    "Technical Validation",
    "Security Review",
    "Proposal Sent",
    "Negotiation",
    "Contract Sent",
    "Won",
    "Lost",
]

DealType = Literal["new_business", "expansion", "renewal"]


class DealCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    company_id: uuid.UUID
    primary_contact_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    value: Optional[Decimal] = Field(default=None, ge=0)
    expected_close_date: Optional[date] = None
    deal_type: DealType = "new_business"
    product_line: Optional[str] = Field(default=None, max_length=100)


class DealUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    primary_contact_id: Optional[uuid.UUID] = None
    owner_id: Optional[uuid.UUID] = None
    value: Optional[Decimal] = Field(default=None, ge=0)
    expected_close_date: Optional[date] = None
    deal_type: Optional[DealType] = None
    product_line: Optional[str] = Field(default=None, max_length=100)
    probability: Optional[int] = Field(default=None, ge=0, le=100)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    lost_reason: Optional[str] = None


class DealStageUpdate(BaseModel):
    stage: str = Field(..., description="Target pipeline stage")

    def validate_stage(self) -> None:
        if self.stage not in PIPELINE_STAGES:
            raise ValueError(
                f"Invalid stage '{self.stage}'. Must be one of: {', '.join(PIPELINE_STAGES)}"
            )


class StageHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    deal_id: uuid.UUID
    from_stage: Optional[str]
    to_stage: str
    changed_by: uuid.UUID
    changed_by_name: Optional[str] = None
    changed_at: datetime
    days_in_stage: Optional[int]


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    company_id: uuid.UUID
    company_name: Optional[str] = None
    primary_contact_id: Optional[uuid.UUID]
    primary_contact_name: Optional[str] = None
    owner_id: uuid.UUID
    owner_name: Optional[str] = None
    stage: str
    value: Optional[Decimal]
    probability: Optional[int]
    currency: str
    expected_close_date: Optional[date]
    product_line: Optional[str]
    deal_type: str
    lost_reason: Optional[str]
    days_in_stage: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    closed_at: Optional[datetime]


class DealListItem(BaseModel):
    """Compact deal representation for kanban cards."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    company_id: uuid.UUID
    company_name: Optional[str] = None
    owner_id: uuid.UUID
    owner_name: Optional[str] = None
    stage: str
    value: Optional[Decimal]
    probability: Optional[int]
    currency: str
    deal_type: str
    days_in_stage: Optional[int] = None


class DealFilters(BaseModel):
    owner_id: Optional[uuid.UUID] = None
    stage: Optional[str] = None
    deal_type: Optional[DealType] = None
