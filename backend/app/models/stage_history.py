from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StageHistory(Base):
    __tablename__ = "stage_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    deal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("deals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_stage: Mapped[str | None] = mapped_column(sa.VARCHAR(50), nullable=True)
    to_stage: Mapped[str] = mapped_column(sa.VARCHAR(50), nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    changed_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    days_in_stage: Mapped[int | None] = mapped_column(sa.Integer, nullable=True)

    # Relationships
    deal: Mapped["Deal"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Deal", back_populates="stage_history"
    )
    changer: Mapped["User"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "User", back_populates="stage_changes"
    )
