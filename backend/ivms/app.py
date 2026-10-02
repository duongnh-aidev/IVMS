"""Application factory: shared resources, error handling and the feature routers."""

from contextlib import asynccontextmanager

import httpx
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ivms.core.config import Settings, get_settings
from ivms.core.db import create_pool
from ivms.core.errors import install_error_handlers
from ivms.features import device_groups, devices

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.settings = settings
        app.state.pool = await create_pool(settings.database_url)
        app.state.mediamtx_http = httpx.AsyncClient(base_url=settings.mediamtx_api_url, timeout=5.0)
        try:
            yield
        finally:
            await app.state.mediamtx_http.aclose()
            await app.state.pool.close()

    app = FastAPI(title="IVMS API", version="0.1.0", lifespan=lifespan, docs_url=f"{API_PREFIX}/docs",
                  openapi_url=f"{API_PREFIX}/openapi.json")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Location"],
    )
    install_error_handlers(app)

    api = APIRouter(prefix=API_PREFIX)
    # One line per feature (docs/backend-api.md §2)
    api.include_router(device_groups.router)
    api.include_router(devices.router)
    app.include_router(api)
    return app
