"""Application configuration via pydantic-settings.  # v2.3 — env parsing hardening"""

import json
from typing import Annotated, List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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

    # ── Field Encryption (audit fix #11) ─────────────────────────
    # Used for application-level encryption of sensitive PII (bank data).
    # In production, use a dedicated key stored in GCP Secret Manager.
    # Falls back to jwt_secret_key for local development convenience.
    encryption_key: str = ""

    @property
    def effective_encryption_key(self) -> str:
        """Return the encryption key, falling back to JWT secret for dev."""
        return self.encryption_key or self.jwt_secret_key

    # ── CORS ─────────────────────────────────────────────────────
    cors_origins: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "https://kinetic-frontend-1065403267999.us-central1.run.app",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        """Accept JSON array, comma-separated string, or single URL."""
        if isinstance(value, list):
            return value
        if value is None:
            return []
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if not isinstance(parsed, list):
                        raise ValueError("CORS_ORIGINS JSON must decode to a list")
                    return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    # Support accidental bracketed non-JSON format: [https://foo.example.com]
                    compact = raw.strip("[]").strip()
                    if not compact:
                        return []
                    return [part.strip() for part in compact.split(",") if part.strip()]
            if "," in raw:
                return [part.strip() for part in raw.split(",") if part.strip()]
            return [raw]
        raise ValueError("Unsupported CORS_ORIGINS value type")

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.environment == "production"

    @property
    def effective_cors_origins(self) -> List[str]:
        """Returns CORS origins for the current environment."""
        return self.cors_origins

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
