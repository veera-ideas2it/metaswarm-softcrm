from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

deal_type_enum = sa.Enum(
    "new_business", "expansion", "renewal", name="deal_type"
)


class Deal(Base):
    __tablename__ = "deals"
    __table_args__ = (
        sa.Index("ix_deals_owner_id", "owner_id"),
        sa.Index("ix_deals_stage", "stage"),
        sa.Index("ix_deals_company_id", "company_id"),
        sa.Index("ix_deals_expected_close_date", "expected_close_date"),
        sa.CheckConstraint("probability IS NULL OR (probability >= 0 AND probability <= 100)", name="ck_deals_probability_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(sa.VARCHAR(255), nullable=False)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=False,
    )
    primary_contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(
        sa.VARCHAR(50), nullable=False, server_default="Lead"
    )
    value: Mapped[Decimal | None] = mapped_column(
        sa.Numeric(12, 2), nullable=True
    )
    probability: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)
    currency: Mapped[str] = mapped_column(
        sa.VARCHAR(3), nullable=False, server_default="USD"
    )
    expected_close_date: Mapped[date | None] = mapped_column(sa.Date, nullable=True)
    product_line: Mapped[str | None] = mapped_column(sa.VARCHAR(100), nullable=True)
    deal_type: Mapped[str] = mapped_column(
        deal_type_enum, nullable=False, server_default="new_business"
    )
    lost_reason: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
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
    closed_at: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
    )

    # Relationships
    company: Mapped["Company"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Company", back_populates="deals"
    )
    primary_contact: Mapped["Contact | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Contact", back_populates="deals_as_primary", foreign_keys=[primary_contact_id]
    )
    owner: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="owned_deals", foreign_keys=[owner_id]
    )
    activities: Mapped[list["Activity"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Activity", back_populates="deal"
    )
    stage_history: Mapped[list["StageHistory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "StageHistory", back_populates="deal", cascade="all, delete-orphan"
    )
