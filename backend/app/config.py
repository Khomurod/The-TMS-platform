"""Application configuration via pydantic-settings."""

from typing import List

from pydantic import model_validator
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
    database_url: str = "postgresql+asyncpg://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms"

    # ── JWT Authentication ───────────────────────────────────────
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ── CORS ─────────────────────────────────────────────────────
    cors_origins: List[str] = [
        "http://localhost:3000",
        "https://kinetic-frontend-1065403267999.us-central1.run.app",
    ]

    # ── Google Cloud Storage (Phase 3) ───────────────────────────
    gcs_bucket_name: str = ""
    gcs_credentials_path: str = ""  # legacy — prefer gcs_credentials_json
    gcs_credentials_json: str = ""  # service account key as JSON string
    google_application_credentials: str = ""  # file path alternative

    # ── GCP Project ──────────────────────────────────────────────
    gcp_project_id: str = ""

    @model_validator(mode='after')
    def validate_production_secrets(self):
        if self.environment == "production":
            if self.jwt_secret_key == "dev-secret-key-change-in-production":
                raise ValueError(
                    "FATAL: JWT_SECRET_KEY must be changed from the default in production! "
                    "Set the JWT_SECRET_KEY environment variable."
                )
            if "Safehaul_dev_2024" in self.database_url:
                raise ValueError(
                    "FATAL: DATABASE_URL contains development credentials. "
                    "Set the DATABASE_URL environment variable for production."
                )
            if not self.cors_origins or all(o.startswith("http://localhost") for o in self.cors_origins):
                raise ValueError(
                    "FATAL: CORS_ORIGINS must include a production domain. "
                    "Set the CORS_ORIGINS environment variable."
                )
        return self


settings = Settings()
