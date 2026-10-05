"""Application factory: shared resources, error handling and the feature controllers' routers."""

from contextlib import asynccontextmanager

import httpx
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ivms.core.config import Settings, get_settings
from ivms.core.db import create_pool
from ivms.core.errors import install_error_handlers
from ivms.core.frontend import SinglePageApp
from ivms.features import auth, device_groups, devices, system

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.pool = await create_pool(settings.database_url)
        app.state.mediamtx_http = httpx.AsyncClient(base_url=settings.mediamtx_api_url, timeout=5.0)
        try:
            yield
        finally:
            await app.state.mediamtx_http.aclose()
            await app.state.pool.close()

    app = FastAPI(title="IVMS API", version=system.controller.VERSION, lifespan=lifespan, docs_url=f"{API_PREFIX}/docs",
                  openapi_url=f"{API_PREFIX}/openapi.json")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Location"],
    )
    # Set here, not in lifespan: token checks read it, and tests run without the lifespan
    app.state.settings = settings
    install_error_handlers(app)

    api = APIRouter(prefix=API_PREFIX)
    # One line per feature (docs/backend-api.md §2)
    api.include_router(auth.router)
    api.include_router(device_groups.router)
    api.include_router(devices.router)
    api.include_router(system.router)
    app.include_router(api)

    # Packaged builds: the UI on the same origin as the API. Mounted last so API routes win.
    if settings.frontend_dist.joinpath("index.html").is_file():
        app.mount("/", SinglePageApp(settings.frontend_dist, API_PREFIX), name="frontend")
    return app
