from __future__ import annotations

import math
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int

    @classmethod
    def build(cls, total: int, page: int, per_page: int) -> "PaginationMeta":
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        return cls(total=total, page=page, per_page=per_page, total_pages=total_pages)


class Response(BaseModel, Generic[T]):
    data: Optional[T] = None
    error: Optional[str] = None
    meta: Optional[PaginationMeta] = None


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    error: None = None
    meta: PaginationMeta


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    per_page: int = Field(default=20, ge=1, le=200, description="Items per page")
    sort_by: str = Field(default="created_at", description="Column name to sort by")
    sort_order: str = Field(default="desc", description="Sort direction: asc or desc")

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        v = v.lower()
        if v not in ("asc", "desc"):
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page
