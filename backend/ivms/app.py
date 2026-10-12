"""Application factory: shared resources, error handling, the feature controllers' routers and plugins."""

import re
from collections import Counter
from collections.abc import Sequence
from contextlib import AsyncExitStack, asynccontextmanager

import httpx
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import iter_route_contexts

from ivms.core.config import Settings, get_settings
from ivms.core.db import create_pool
from ivms.core.deps import PERMISSIONS, check_permissions
from ivms.core.errors import install_error_handlers
from ivms.core.frontend import SinglePageApp
from ivms.features import auth, device_groups, devices, system
from ivms.plugins import Plugin, PluginError, Plugins, check_unique, discover, event_bus

API_PREFIX = "/api/v1"


def create_app(settings: Settings | None = None, plugins: Sequence[Plugin] | None = None) -> FastAPI:
    """`plugins` defaults to the installed ones (entry point group `ivms.plugins`)."""
    settings = settings or get_settings()
    plugins = discover() if plugins is None else list(plugins)
    check_unique(plugins, PERMISSIONS)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.pool = await create_pool(settings.database_url)
        app.state.mediamtx_http = httpx.AsyncClient(base_url=settings.mediamtx_api_url, timeout=5.0)
        try:
            async with AsyncExitStack() as stack:
                for plugin in plugins:
                    if plugin.lifespan:
                        await stack.enter_async_context(plugin.lifespan(app))
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
    app.state.plugins = Plugins(plugins)
    app.state.events = event_bus(plugins)
    install_error_handlers(app)

    api = APIRouter(prefix=API_PREFIX)
    # One line per feature (docs/backend-api.md §2)
    api.include_router(auth.router)
    api.include_router(device_groups.router)
    api.include_router(devices.router)
    api.include_router(system.router)
    # Plugins come after the core, so they can add routes but never shadow one
    for plugin in plugins:
        for router in plugin.routers:
            api.include_router(router)
    app.include_router(api)
    _check_routes(app, [*PERMISSIONS, *(key for plugin in plugins for key in plugin.permissions)])

    # Packaged builds: the UI on the same origin as the API. Mounted last so API routes win.
    if settings.frontend_dist.joinpath("index.html").is_file():
        app.mount("/", SinglePageApp(settings.frontend_dist, API_PREFIX), name="frontend")
    return app


def _check_routes(app: FastAPI, permissions: list[str]) -> None:
    """Every method + path is defined once, and every declared permission exists."""
    # Flattens the routers include_router() adds lazily
    routes = [r for r in iter_route_contexts(app.routes) if r.path and r.methods]
    # /devices/{id} and /devices/{device_id} are the same route
    seen = Counter((method, re.sub(r"\{[^}]*\}", "{}", r.path)) for r in routes for method in r.methods)
    if dupes := sorted(f"{method} {path}" for (method, path), n in seen.items() if n > 1):
        raise PluginError(f"Routes defined more than once: {', '.join(dupes)}")
    check_permissions(routes, permissions)
