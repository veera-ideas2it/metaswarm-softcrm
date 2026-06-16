from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    POSTGRES_DB: str = "softcrm"
    POSTGRES_USER: str = "softcrm"
    POSTGRES_PASSWORD: str = "softcrm"
    DATABASE_URL: str = "postgresql+asyncpg://softcrm:softcrm@db:5432/softcrm"

    # JWT / Auth
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5174"]


settings = Settings()
