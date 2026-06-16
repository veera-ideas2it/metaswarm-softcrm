"""SQLAlchemy models package.

Import all models here so that Alembic's env.py and create_tables()
can discover them via Base.metadata.
"""
from app.models.user import User  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.deal import Deal  # noqa: F401
from app.models.activity import Activity  # noqa: F401
from app.models.stage_history import StageHistory  # noqa: F401

__all__ = [
    "User",
    "Company",
    "Contact",
    "Deal",
    "Activity",
    "StageHistory",
]
