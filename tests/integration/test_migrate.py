"""The Python migration runner against a fresh database, and its compatibility with Prisma's records."""

import shutil
from uuid import uuid4

import asyncpg
import pytest

from ivms.core.config import get_settings
from ivms.core.migrate import MigrationError, migrate


@pytest.fixture
async def fresh_db():
    """DSN of a new empty database, dropped afterwards."""
    settings = get_settings()
    try:
        admin = await asyncpg.connect(settings.database_url)
    except (OSError, asyncpg.PostgresError) as e:
        pytest.skip(f"PostgreSQL not available: {e}")
    name = f"ivms_test_{uuid4().hex[:8]}"
    await admin.execute(f'CREATE DATABASE "{name}"')
    try:
        yield settings.database_url.rsplit("/", 1)[0] + "/" + name
    finally:
        await admin.execute(f'DROP DATABASE "{name}" WITH (FORCE)')
        await admin.close()


async def test_applies_all_migrations_once(fresh_db):
    directory = get_settings().migrations_dir
    names = sorted(p.name for p in directory.iterdir() if p.is_dir())

    assert await migrate(fresh_db, directory) == names
    assert await migrate(fresh_db, directory) == []

    conn = await asyncpg.connect(fresh_db)
    try:
        rows = await conn.fetch("SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY 1")
        assert [r["migration_name"] for r in rows] == names and all(r["finished_at"] for r in rows)
        assert await conn.fetchval("SELECT to_regclass('users')") == "users"
    finally:
        await conn.close()


async def test_refuses_an_edited_migration(fresh_db, tmp_path):
    directory = tmp_path / "migrations"
    shutil.copytree(get_settings().migrations_dir, directory)
    await migrate(fresh_db, directory)
    first = min(directory.iterdir()) / "migration.sql"
    first.write_text(first.read_text() + "\n-- edited")

    with pytest.raises(MigrationError, match="modified after it was applied"):
        await migrate(fresh_db, directory)
