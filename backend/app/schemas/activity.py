from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


ActivityType = Literal["call", "email", "meeting", "note", "task"]


class ActivityCreate(BaseModel):
    deal_id: Optional[uuid.UUID] = None
    contact_id: Optional[uuid.UUID] = None
    type: ActivityType
    subject: str = Field(..., min_length=1, max_length=255)
    body: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class ActivityUpdate(BaseModel):
    subject: Optional[str] = Field(default=None, min_length=1, max_length=255)
    body: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    type: Optional[ActivityType] = None


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    deal_id: Optional[uuid.UUID]
    deal_title: Optional[str] = None
    contact_id: Optional[uuid.UUID]
    contact_name: Optional[str] = None
    user_id: uuid.UUID
    user_name: Optional[str] = None
    type: str
    subject: str
    body: Optional[str]
    scheduled_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class ActivityFilters(BaseModel):
    type: Optional[ActivityType] = None
    user_id: Optional[uuid.UUID] = None
    deal_id: Optional[uuid.UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
