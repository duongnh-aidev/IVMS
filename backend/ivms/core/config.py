"""Settings read from the environment and `.env` (see .env.example)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "127.0.0.1"
    api_port: int = 8000
    api_reload: bool = False
    # Origins allowed to call the API from a browser (the Vite dev server proxies /api, so this is
    # only needed when the client talks to the backend directly)
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str = "postgresql://ivms:ivms@localhost:5432/ivms"
    redis_url: str = "redis://localhost:6379/0"

    mediamtx_api_url: str = "http://localhost:9997"
    mediamtx_rtsp_url: str = "rtsp://localhost:8554"

    # Encrypts secrets stored in the database (camera passwords). Changing it makes them unreadable.
    secret_key: str = "dev-only-insecure-secret-key"


@lru_cache
def get_settings() -> Settings:
    return Settings()
