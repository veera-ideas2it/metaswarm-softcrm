from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

company_size_enum = sa.Enum(
    "startup", "smb", "mid_market", "enterprise", name="company_size"
)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(sa.VARCHAR(255), nullable=False)
    domain: Mapped[str | None] = mapped_column(sa.VARCHAR(255), nullable=True)
    industry: Mapped[str | None] = mapped_column(sa.VARCHAR(100), nullable=True)
    size: Mapped[str | None] = mapped_column(company_size_enum, nullable=True)
    website: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    country: Mapped[str | None] = mapped_column(sa.VARCHAR(100), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
    )

    # Relationships
    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="companies", foreign_keys=[created_by]
    )
    contacts: Mapped[list["Contact"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Contact", back_populates="company"
    )
    deals: Mapped[list["Deal"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Deal", back_populates="company"
    )
