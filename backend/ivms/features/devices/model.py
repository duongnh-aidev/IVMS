from __future__ import annotations  # methods named `list` shadow the builtin in annotations

from uuid import UUID

import asyncpg

from ivms.core.errors import Conflict, Invalid

_COLUMNS = """
    id, seq, name, host, port, path, username, coalesce(password_enc, '') <> '' AS has_password,
    group_id, model, firmware, status::text AS status, last_seen_at, created_at, updated_at
"""
# API sort key → SQL expression (whitelist: never interpolate client input)
_SORT = {"name": "lower(name)", "code": "seq", "status": "status", "createdAt": "created_at"}
# Columns a create/update may write
_WRITABLE = ("name", "host", "port", "path", "username", "password_enc", "group_id", "model", "firmware")


def _escape_like(s: str) -> str:
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class DeviceModel:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    def transaction(self):
        return self.conn.transaction()

    async def list(
        self,
        *,
        group_ids: list[UUID] | None,
        status: str | None,
        q: str | None,
        sort: str,
        limit: int,
        offset: int,
    ) -> tuple[list[dict], int]:
        where, args = [], []
        if group_ids is not None:
            args.append(group_ids)
            where.append(f"group_id = ANY(${len(args)})")
        if status:
            args.append(status)
            where.append(f"status = ${len(args)}::device_status")
        if q:
            args.append(f"%{_escape_like(q)}%")
            where.append(f"(name ILIKE ${len(args)} OR host ILIKE ${len(args)})")
        desc = sort.startswith("-")
        order = _SORT[sort.lstrip("-")] + (" DESC" if desc else "")
        args += [limit, offset]
        rows = await self.conn.fetch(
            f"SELECT {_COLUMNS}, count(*) OVER () AS _total FROM devices"
            f" {'WHERE ' + ' AND '.join(where) if where else ''}"
            f" ORDER BY {order}, seq LIMIT ${len(args) - 1} OFFSET ${len(args)}",
            *args,
        )
        total = rows[0]["_total"] if rows else await self._count(where, args[:-2])
        return [{k: v for k, v in r.items() if k != "_total"} for r in rows], total

    async def _count(self, where: list[str], args: list) -> int:
        # Page past the end: the window count is unavailable, ask directly
        return await self.conn.fetchval(
            f"SELECT count(*) FROM devices {'WHERE ' + ' AND '.join(where) if where else ''}", *args
        )

    async def get(self, device_id: UUID) -> dict | None:
        row = await self.conn.fetchrow(f"SELECT {_COLUMNS} FROM devices WHERE id = $1", device_id)
        return dict(row) if row else None

    async def get_connection(self, device_id: UUID) -> dict | None:
        """host, port, path, username, password_enc: what is needed to pull the stream."""
        row = await self.conn.fetchrow(
            "SELECT host, port, path, username, password_enc FROM devices WHERE id = $1", device_id
        )
        return dict(row) if row else None

    async def create(self, fields: dict) -> UUID:
        cols = [c for c in _WRITABLE if c in fields]
        placeholders = ", ".join(f"${i + 1}" for i in range(len(cols)))
        with _translate_errors():
            return await self.conn.fetchval(
                f"INSERT INTO devices ({', '.join(cols)}) VALUES ({placeholders}) RETURNING id",
                *(fields[c] for c in cols),
            )

    async def update(self, device_id: UUID, fields: dict) -> bool:
        """Returns False if the device does not exist."""
        cols = [c for c in _WRITABLE if c in fields]
        if not cols:
            return await self.get(device_id) is not None
        sets = ", ".join(f"{c} = ${i + 2}" for i, c in enumerate(cols))
        with _translate_errors():
            status = await self.conn.execute(
                f"UPDATE devices SET {sets}, updated_at = now() WHERE id = $1", device_id, *(fields[c] for c in cols)
            )
        return status != "UPDATE 0"

    async def delete(self, device_id: UUID) -> bool:
        return await self.conn.execute("DELETE FROM devices WHERE id = $1", device_id) != "DELETE 0"


class _translate_errors:
    """Turns constraint violations into domain errors."""

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if isinstance(exc, asyncpg.ForeignKeyViolationError):
            raise Invalid("Device group not found") from exc
        if isinstance(exc, asyncpg.UniqueViolationError):
            raise Conflict("A device with this address and path already exists") from exc
        return False
