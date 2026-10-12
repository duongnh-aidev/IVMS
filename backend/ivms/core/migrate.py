"""Applies db/prisma/migrations without Node, for packaged builds (Docker image, macOS app), then the
migrations of installed plugins.

Core migrations use Prisma's own bookkeeping table, so a database migrated here can still be handled by
`prisma migrate` and the other way round. Development keeps using `uv run poe db-migrate`.

Plugin migrations are recorded in `ivms_plugins.migrations`, outside the `public` schema Prisma manages,
so Prisma never sees them as drift. A plugin keeps its tables in its own schema and may reference core
tables, but must not change the `public` schema: a migration that does is rolled back (docs/plugins.md).
"""

import hashlib
import uuid
from collections.abc import Sequence
from pathlib import Path

import asyncpg

# Same table Prisma creates (prisma-engines, schema-engine)
_BOOKKEEPING = """
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
)
"""
_PLUGIN_BOOKKEEPING = """
CREATE SCHEMA IF NOT EXISTS ivms_plugins;
CREATE TABLE IF NOT EXISTS ivms_plugins.migrations (
    "plugin"         VARCHAR(100) NOT NULL,
    "migration_name" VARCHAR(255) NOT NULL,
    "checksum"       VARCHAR(64) NOT NULL,
    "applied_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("plugin", "migration_name")
)
"""
# What a plugin migration must leave untouched: the core's columns, indexes, constraints, triggers and types
_CORE_SHAPE = """
SELECT coalesce(array_agg(item ORDER BY item), '{}') FROM (
    SELECT format('column %s.%s %s null=%s default=%s', table_name, column_name, data_type, is_nullable,
                  column_default) AS item
    FROM information_schema.columns WHERE table_schema = 'public'
    UNION ALL
    SELECT format('index %s', indexdef) FROM pg_indexes WHERE schemaname = 'public'
    UNION ALL
    SELECT format('constraint %s.%s %s', r.relname, c.conname, pg_get_constraintdef(c.oid))
    FROM pg_constraint c JOIN pg_class r ON r.oid = c.conrelid JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public'
    UNION ALL
    SELECT format('trigger %s.%s', r.relname, t.tgname)
    FROM pg_trigger t JOIN pg_class r ON r.oid = t.tgrelid JOIN pg_namespace n ON n.oid = r.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
    UNION ALL
    SELECT format('type %s', t.typname) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
) shape
"""
# Any constant: serializes concurrent migrators (two app instances starting at once)
_LOCK_ID = 72_656_270


class MigrationError(Exception):
    pass


def pending(directory: Path, applied: dict[str, str]) -> list[tuple[str, str, str]]:
    """(name, sql, checksum) of migrations not applied yet, oldest first.

    Raises MigrationError if an applied migration was edited afterwards (checksum differs).
    """
    out = []
    for folder in sorted(p for p in directory.iterdir() if (p / "migration.sql").is_file()):
        sql = (folder / "migration.sql").read_text()
        checksum = hashlib.sha256(sql.encode()).hexdigest()
        if folder.name not in applied:
            out.append((folder.name, sql, checksum))
        elif applied[folder.name] != checksum:
            raise MigrationError(f"Migration {folder.name} was modified after it was applied")
    return out


async def migrate(dsn: str, directory: Path, plugins: Sequence[tuple[str, Path]] = ()) -> list[str]:
    """Applies pending core migrations, then each plugin's, every migration in its own transaction.

    `plugins` is (plugin name, migrations directory) in load order. Returns the names applied, plugin
    ones as `<plugin>/<migration>`.
    """
    for path in [directory, *(d for _, d in plugins)]:
        if not path.is_dir():
            raise MigrationError(f"Migrations directory not found: {path}")
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute("SELECT pg_advisory_lock($1)", _LOCK_ID)
        done = await _migrate_core(conn, directory)
        if plugins:
            await conn.execute(_PLUGIN_BOOKKEEPING)
        for plugin, plugin_dir in plugins:
            done += [f"{plugin}/{name}" for name in await _migrate_plugin(conn, plugin, plugin_dir)]
        return done
    finally:
        await conn.close()  # also releases the advisory lock


async def _migrate_core(conn: asyncpg.Connection, directory: Path) -> list[str]:
    await conn.execute(_BOOKKEEPING)
    failed = await conn.fetchval(
        "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL"
    )
    if failed:
        raise MigrationError(f"Migration {failed} failed earlier; fix the database, then mark it rolled back")
    rows = await conn.fetch("SELECT migration_name, checksum FROM _prisma_migrations WHERE rolled_back_at IS NULL")
    done = []
    for name, sql, checksum in pending(directory, {r["migration_name"]: r["checksum"] for r in rows}):
        async with conn.transaction():
            await conn.execute(sql)
            await conn.execute(
                "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)"
                " VALUES ($1, $2, now(), $3, 1)",
                str(uuid.uuid4()),
                checksum,
                name,
            )
        done.append(name)
    return done


async def _migrate_plugin(conn: asyncpg.Connection, plugin: str, directory: Path) -> list[str]:
    rows = await conn.fetch("SELECT migration_name, checksum FROM ivms_plugins.migrations WHERE plugin = $1", plugin)
    try:
        todo = pending(directory, {r["migration_name"]: r["checksum"] for r in rows})
    except MigrationError as e:
        raise MigrationError(f"Plugin {plugin}: {e}") from None
    done = []
    for name, sql, checksum in todo:
        async with conn.transaction():
            before = await conn.fetchval(_CORE_SHAPE)
            await conn.execute(sql)
            after = await conn.fetchval(_CORE_SHAPE)
            if before != after:
                changed = sorted(set(before) ^ set(after))[:5]
                # Raising inside the transaction rolls the migration back
                raise MigrationError(f"Plugin {plugin} migration {name} changes the core schema: {'; '.join(changed)}")
            await conn.execute(
                "INSERT INTO ivms_plugins.migrations (plugin, migration_name, checksum) VALUES ($1, $2, $3)",
                plugin,
                name,
                checksum,
            )
        done.append(name)
    return done
