"""Settings read from the environment and `.env` (see .env.example)."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Repository root when running from a checkout (packaged builds set the paths below explicitly)
_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "127.0.0.1"
    api_port: int = 8000
    api_reload: bool = False
    # Origins allowed to call the API from a browser (the Vite dev server proxies /api, so this is
    # only needed when the client talks to the backend directly)
    cors_origins: list[str] = ["http://localhost:3000"]
    # Built frontend (`npm run build`) served at / when the folder exists. In development the
    # Vite dev server serves it instead.
    frontend_dist: Path = _ROOT / "frontend" / "dist"

    database_url: str = "postgresql://ivms:ivms@localhost:5432/ivms"
    # Applied by `python -m ivms migrate` (packaged builds; development uses `poe db-migrate`)
    migrations_dir: Path = _ROOT / "db" / "prisma" / "migrations"
    redis_url: str = "redis://localhost:6379/0"

    mediamtx_api_url: str = "http://localhost:9997"
    mediamtx_rtsp_url: str = "rtsp://localhost:8554"

    # Encrypts secrets stored in the database (camera passwords). Changing it makes them unreadable.
    secret_key: str = "dev-only-insecure-secret-key"

    # Signs the JWT access tokens (HS256: at least 32 characters). Changing it signs every user out.
    jwt_secret: str = Field(default="dev-only-insecure-jwt-secret-change-me", min_length=32)
    # Access token lifetime; when it expires the user must sign in again
    access_token_ttl_seconds: int = 30 * 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
