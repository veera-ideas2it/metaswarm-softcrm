from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

activity_type_enum = sa.Enum(
    "call", "email", "meeting", "note", "task", name="activity_type"
)


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        sa.Index("ix_activities_deal_id", "deal_id"),
        sa.Index("ix_activities_contact_id", "contact_id"),
        sa.Index("ix_activities_user_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    deal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
    )
    contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(activity_type_enum, nullable=False)
    subject: Mapped[str] = mapped_column(sa.VARCHAR(255), nullable=False)
    body: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    # Relationships
    deal: Mapped["Deal | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Deal", back_populates="activities"
    )
    contact: Mapped["Contact | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Contact", back_populates="activities"
    )
    user: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="activities"
    )
