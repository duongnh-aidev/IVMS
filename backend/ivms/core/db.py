"""PostgreSQL access: one asyncpg pool per process, one connection per request."""

from collections.abc import AsyncIterator
from typing import Annotated

import asyncpg
from fastapi import Depends, Request


async def create_pool(dsn: str) -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn, min_size=1, max_size=10)


async def get_conn(request: Request) -> AsyncIterator[asyncpg.Connection]:
    """Borrows a pooled connection for the duration of the request."""
    async with request.app.state.pool.acquire() as conn:
        yield conn


Conn = Annotated[asyncpg.Connection, Depends(get_conn)]
