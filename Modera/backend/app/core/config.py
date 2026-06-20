"""Application configuration and sensible defaults.

Settings are loaded from `.env` files (if present) and environment variables.
Defaults are chosen for local development; change them for production.
"""

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    # Use project-level .env and backend/.env if present (dev convenience).
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), str(PROJECT_ROOT / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App-level defaults (safe for local development only)
    PROJECT_NAME: str = "AI Moderation Platform"
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "moderation_db"
    SECRET_KEY: str = Field(default="dev-secret-key-change-me")
    GEMINI_API_KEY: str | None = Field(default=None)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    AI_PROVIDER: str = "gemini"
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # Default admin credentials used only for local development and CI.
    # Override via environment variables in production and when pushing
    # deployable stacks so credentials are not baked into images.
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "Admin123!"

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def normalize_secret_key(cls, value):
        # Provide a fallback secret for development only. In production set
        # `SECRET_KEY` via environment variable or a secrets manager.
        if value is None or str(value).strip() == "":
            return "dev-secret-key-change-me"
        return value

    @field_validator("GEMINI_API_KEY", mode="before")
    @classmethod
    def normalize_gemini_key(cls, value):
        if value is None or str(value).strip() == "":
            return None
        return value


settings = Settings()
