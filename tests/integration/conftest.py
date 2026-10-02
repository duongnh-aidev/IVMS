"""Integration tests run against the compose PostgreSQL with migrations applied
(`uv run poe infra && uv run poe db-deploy`). Each test runs in a transaction that is rolled back."""

import asyncpg
import pytest

from ivms.core.config import get_settings


@pytest.fixture
async def conn():
    try:
        c = await asyncpg.connect(get_settings().database_url)
    except (OSError, asyncpg.PostgresError) as e:
        pytest.skip(f"PostgreSQL not available: {e}")
    tx = c.transaction()
    await tx.start()
    try:
        yield c
    finally:
        await tx.rollback()
        await c.close()
