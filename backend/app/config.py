"""Application configuration via pydantic-settings."""

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Environment ──────────────────────────────────────────────
    environment: str = "development"
    debug: bool = True

    # ── Database ─────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://kinetic:kinetic_dev_2024@localhost:5432/kinetic_tms"

    # ── JWT Authentication ───────────────────────────────────────
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ── CORS ─────────────────────────────────────────────────────
    cors_origins: List[str] = ["http://localhost:3000"]

    # ── Google Cloud Storage (Phase 3) ───────────────────────────
    gcs_bucket_name: str = ""
    gcs_credentials_path: str = ""


settings = Settings()
