"""Shared FastAPI dependencies."""

from fastapi import Depends

# Permission keys, see docs/backend-api.md §5
PERMISSIONS = ("live", "playback", "export", "ptz", "ack", "devices", "record", "users")


def require(permission: str):
    """Route dependency declaring the permission a route needs.

    Not enforced yet: every request is allowed until the auth feature lands. Routes declare it
    now so turning enforcement on is a change to this function only.
    """
    if permission not in PERMISSIONS:
        raise ValueError(f"Unknown permission: {permission}")

    async def _check() -> None:
        return None

    return Depends(_check)
