"""Applies db/prisma/migrations without Node, for packaged builds (Docker image, macOS app).

Uses Prisma's own bookkeeping table, so a database migrated here can still be handled by
`prisma migrate` and the other way round. Development keeps using `uv run poe db-migrate`.
"""

import hashlib
import uuid
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


async def migrate(dsn: str, directory: Path) -> list[str]:
    """Applies pending migrations, each in its own transaction. Returns their names."""
    if not directory.is_dir():
        raise MigrationError(f"Migrations directory not found: {directory}")
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute("SELECT pg_advisory_lock($1)", _LOCK_ID)
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
    finally:
        await conn.close()  # also releases the advisory lock
