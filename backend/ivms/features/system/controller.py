from importlib.metadata import PackageNotFoundError, version

from fastapi import APIRouter

from ivms.core.db import Conn
from ivms.plugins import LoadedPlugins

from .view import Health, Info

try:
    VERSION = version("ivms")
except PackageNotFoundError:  # running from a source tree that is not installed
    VERSION = "dev"


# ---- HTTP routes ----

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def health(conn: Conn) -> Health:
    """Public. 200 when the API and its database answer (used by Docker and the macOS launcher)."""
    await conn.fetchval("SELECT 1")
    return Health(status="ok", version=VERSION)


@router.get("/info")
async def info(plugins: LoadedPlugins) -> Info:
    """Public (the sign-in screen shows the edition). Clients re-read it after a licence change."""
    return Info(version=VERSION, edition=plugins.edition(), features=sorted(plugins.features()))
