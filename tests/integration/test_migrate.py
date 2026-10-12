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


def plugin_migrations(tmp_path, *sqls: str):
    """A plugin migrations folder with one migration per SQL string."""
    directory = tmp_path / "plugin_migrations"
    for i, sql in enumerate(sqls):
        (directory / f"2026101200000{i}_step{i}").mkdir(parents=True)
        (directory / f"2026101200000{i}_step{i}" / "migration.sql").write_text(sql)
    return directory


ACME_INIT = """
CREATE SCHEMA acme;
CREATE TABLE acme.detections (
    id        BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE
);
"""


async def test_applies_plugin_migrations_after_the_core_and_records_them_apart(fresh_db, tmp_path):
    core = get_settings().migrations_dir
    plugin = plugin_migrations(tmp_path, ACME_INIT, "CREATE INDEX ON acme.detections (device_id);")

    applied = await migrate(fresh_db, core, [("acme", plugin)])

    core_names = sorted(p.name for p in core.iterdir() if p.is_dir())
    assert applied == [*core_names, "acme/20261012000000_step0", "acme/20261012000001_step1"]
    assert await migrate(fresh_db, core, [("acme", plugin)]) == []

    conn = await asyncpg.connect(fresh_db)
    try:
        # Prisma's table only knows the core migrations, so `prisma migrate` sees no drift
        assert await conn.fetchval("SELECT count(*) FROM _prisma_migrations") == len(core_names)
        assert await conn.fetchval("SELECT count(*) FROM ivms_plugins.migrations WHERE plugin = 'acme'") == 2
        assert await conn.fetchval("SELECT to_regclass('acme.detections')") == "acme.detections"
    finally:
        await conn.close()


async def test_core_only_migration_leaves_no_plugin_schema(fresh_db):
    await migrate(fresh_db, get_settings().migrations_dir)

    conn = await asyncpg.connect(fresh_db)
    try:
        assert await conn.fetchval("SELECT to_regnamespace('ivms_plugins')") is None
    finally:
        await conn.close()


@pytest.mark.parametrize(
    "sql",
    [
        "ALTER TABLE devices ADD COLUMN ai_enabled BOOLEAN",
        "CREATE TABLE detections (id BIGSERIAL PRIMARY KEY)",
        "CREATE INDEX devices_name_idx ON devices (name)",
        "ALTER TABLE users ALTER COLUMN name DROP NOT NULL",
    ],
    ids=["add core column", "table in public", "index on core table", "relax core column"],
)
async def test_refuses_and_rolls_back_a_plugin_migration_that_changes_the_core(fresh_db, tmp_path, sql):
    core = get_settings().migrations_dir
    await migrate(fresh_db, core)
    plugin = plugin_migrations(tmp_path, f"CREATE SCHEMA acme; {sql};")

    with pytest.raises(MigrationError, match="acme migration 20261012000000_step0 changes the core schema"):
        await migrate(fresh_db, core, [("acme", plugin)])

    conn = await asyncpg.connect(fresh_db)
    try:
        assert await conn.fetchval("SELECT to_regnamespace('acme')") is None  # whole migration rolled back
        assert await conn.fetchval("SELECT count(*) FROM ivms_plugins.migrations") == 0
    finally:
        await conn.close()


async def test_refuses_an_edited_plugin_migration(fresh_db, tmp_path):
    core = get_settings().migrations_dir
    plugin = plugin_migrations(tmp_path, ACME_INIT)
    await migrate(fresh_db, core, [("acme", plugin)])
    (next(plugin.iterdir()) / "migration.sql").write_text(ACME_INIT + "\n-- edited")

    with pytest.raises(MigrationError, match="Plugin acme: .* modified after it was applied"):
        await migrate(fresh_db, core, [("acme", plugin)])
