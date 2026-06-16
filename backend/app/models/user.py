from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

user_role_enum = sa.Enum("admin", "manager", "rep", name="user_role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        sa.VARCHAR(255), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(sa.VARCHAR(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(sa.Text, nullable=False)
    role: Mapped[str] = mapped_column(
        user_role_enum, nullable=False, server_default="rep"
    )
    avatar_url: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.true()
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
    companies: Mapped[list["Company"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Company", back_populates="creator", foreign_keys="Company.created_by"
    )
    contacts: Mapped[list["Contact"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Contact", back_populates="creator", foreign_keys="Contact.created_by"
    )
    owned_deals: Mapped[list["Deal"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Deal", back_populates="owner", foreign_keys="Deal.owner_id"
    )
    activities: Mapped[list["Activity"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Activity", back_populates="user"
    )
    stage_changes: Mapped[list["StageHistory"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "StageHistory", back_populates="changer"
    )
