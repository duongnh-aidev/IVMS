"""Shared FastAPI dependencies."""

from collections.abc import Iterable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.routing import RouteContext
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ivms.core.errors import Unauthorized
from ivms.core.security import TokenCodec

# Permission keys, see docs/backend-api.md §5
PERMISSIONS = ("live", "playback", "export", "ptz", "ack", "devices", "record", "users")

# auto_error=False: a missing header goes through our own 401 (problem+json)
_bearer = HTTPBearer(auto_error=False)


def get_token_codec(request: Request) -> TokenCodec:
    settings = request.app.state.settings
    return TokenCodec(settings.jwt_secret, settings.access_token_ttl_seconds)


async def current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    codec: Annotated[TokenCodec, Depends(get_token_codec)],
) -> UUID:
    """The signed-in user, from `Authorization: Bearer <access token>`. 401 if missing, invalid or expired."""
    if credentials is None:
        raise Unauthorized("Sign in required")
    return codec.verify(credentials.credentials)


CurrentUserId = Annotated[UUID, Depends(current_user_id)]


def require(permission: str):
    """Route dependency declaring the permission a route needs.

    Requires a valid access token. The permission itself is not checked yet (roles come with the
    users feature); routes declare it now so turning that on is a change to this function only.
    The key is validated by `check_permissions` when the app starts, because plugins add their own keys.
    """

    async def _check(_: CurrentUserId) -> None:
        return None

    _check.permission = permission
    return Depends(_check)


def check_permissions(routes: Iterable[RouteContext], known: Iterable[str]) -> None:
    """Raises ValueError if a route declares a permission key that is not in `known`."""
    known = set(known)
    for route in routes:
        for dep in getattr(route, "dependencies", None) or ():
            permission = getattr(dep.dependency, "permission", None)
            if permission is not None and permission not in known:
                raise ValueError(f"Unknown permission {permission!r} on {route.path}")
