"""Initial schema — all 6 tables

Revision ID: 001
Revises:
Create Date: 2026-06-16 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Enable pgcrypto for gen_random_uuid() (harmless if already enabled)
    # ------------------------------------------------------------------
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ------------------------------------------------------------------
    # ENUM types
    # ------------------------------------------------------------------
    user_role = postgresql.ENUM("admin", "manager", "rep", name="user_role", create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)

    company_size = postgresql.ENUM(
        "startup", "smb", "mid_market", "enterprise", name="company_size", create_type=False
    )
    company_size.create(op.get_bind(), checkfirst=True)

    deal_type = postgresql.ENUM(
        "new_business", "expansion", "renewal", name="deal_type", create_type=False
    )
    deal_type.create(op.get_bind(), checkfirst=True)

    activity_type = postgresql.ENUM(
        "call", "email", "meeting", "note", "task", name="activity_type", create_type=False
    )
    activity_type.create(op.get_bind(), checkfirst=True)

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.VARCHAR(255), nullable=False),
        sa.Column("full_name", sa.VARCHAR(255), nullable=False),
        sa.Column("hashed_password", sa.Text, nullable=False),
        sa.Column("role", sa.Enum("admin", "manager", "rep", name="user_role"), nullable=False, server_default="rep"),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # companies
    # ------------------------------------------------------------------
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.VARCHAR(255), nullable=False),
        sa.Column("domain", sa.VARCHAR(255), nullable=True),
        sa.Column("industry", sa.VARCHAR(100), nullable=True),
        sa.Column("size", sa.Enum("startup", "smb", "mid_market", "enterprise", name="company_size"), nullable=True),
        sa.Column("website", sa.Text, nullable=True),
        sa.Column("country", sa.VARCHAR(100), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_companies_created_by", "companies", ["created_by"])

    # ------------------------------------------------------------------
    # contacts
    # ------------------------------------------------------------------
    op.create_table(
        "contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("first_name", sa.VARCHAR(100), nullable=False),
        sa.Column("last_name", sa.VARCHAR(100), nullable=False),
        sa.Column("email", sa.VARCHAR(255), nullable=True),
        sa.Column("phone", sa.VARCHAR(50), nullable=True),
        sa.Column("title", sa.VARCHAR(150), nullable=True),
        sa.Column("is_decision_maker", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("linkedin_url", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_contacts_company_id", "contacts", ["company_id"])
    op.create_index("ix_contacts_created_by", "contacts", ["created_by"])

    # ------------------------------------------------------------------
    # deals
    # ------------------------------------------------------------------
    op.create_table(
        "deals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.VARCHAR(255), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("primary_contact_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("stage", sa.VARCHAR(50), nullable=False, server_default="Lead"),
        sa.Column("value", sa.Numeric(12, 2), nullable=True),
        sa.Column("probability", sa.Integer, nullable=True),
        sa.Column("currency", sa.VARCHAR(3), nullable=False, server_default="USD"),
        sa.Column("expected_close_date", sa.Date, nullable=True),
        sa.Column("product_line", sa.VARCHAR(100), nullable=True),
        sa.Column("deal_type", sa.Enum("new_business", "expansion", "renewal", name="deal_type"), nullable=False, server_default="new_business"),
        sa.Column("lost_reason", sa.Text, nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("closed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.CheckConstraint(
            "probability IS NULL OR (probability >= 0 AND probability <= 100)",
            name="ck_deals_probability_range",
        ),
    )
    op.create_index("ix_deals_owner_id", "deals", ["owner_id"])
    op.create_index("ix_deals_stage", "deals", ["stage"])
    op.create_index("ix_deals_company_id", "deals", ["company_id"])
    op.create_index("ix_deals_expected_close_date", "deals", ["expected_close_date"])

    # ------------------------------------------------------------------
    # activities
    # ------------------------------------------------------------------
    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("type", sa.Enum("call", "email", "meeting", "note", "task", name="activity_type"), nullable=False),
        sa.Column("subject", sa.VARCHAR(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("scheduled_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_activities_deal_id", "activities", ["deal_id"])
    op.create_index("ix_activities_contact_id", "activities", ["contact_id"])
    op.create_index("ix_activities_user_id", "activities", ["user_id"])

    # ------------------------------------------------------------------
    # stage_history
    # ------------------------------------------------------------------
    op.create_table(
        "stage_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("deals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_stage", sa.VARCHAR(50), nullable=True),
        sa.Column("to_stage", sa.VARCHAR(50), nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("changed_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("days_in_stage", sa.Integer, nullable=True),
    )
    op.create_index("ix_stage_history_deal_id", "stage_history", ["deal_id"])


def downgrade() -> None:
    # Drop tables in reverse FK dependency order
    op.drop_table("stage_history")
    op.drop_table("activities")
    op.drop_table("deals")
    op.drop_table("contacts")
    op.drop_table("companies")
    op.drop_table("users")

    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS activity_type")
    op.execute("DROP TYPE IF EXISTS deal_type")
    op.execute("DROP TYPE IF EXISTS company_size")
    op.execute("DROP TYPE IF EXISTS user_role")
