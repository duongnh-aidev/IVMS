from uuid import UUID

import asyncpg

from ivms.core.errors import Conflict, Invalid

# Depth-first order, siblings by name, so the client can render the list as a tree as-is
_TREE = """
WITH RECURSIVE tree AS (
    SELECT id, name, parent_id, 0 AS depth, ARRAY[lower(name)] AS sort_path
    FROM device_groups WHERE parent_id IS NULL
    UNION ALL
    SELECT g.id, g.name, g.parent_id, t.depth + 1, t.sort_path || lower(g.name)
    FROM device_groups g JOIN tree t ON g.parent_id = t.id
)
SELECT t.id, t.name, t.parent_id, t.depth,
       (SELECT count(*) FROM devices d WHERE d.group_id = t.id) AS direct_devices
FROM tree t
ORDER BY t.sort_path
"""

_SUBTREE = """
WITH RECURSIVE sub AS (
    SELECT id FROM device_groups WHERE id = $1
    UNION ALL
    SELECT g.id FROM device_groups g JOIN sub s ON g.parent_id = s.id
)
SELECT id FROM sub
"""


class DeviceGroupModel:
    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def tree(self) -> list[dict]:
        return [dict(r) for r in await self.conn.fetch(_TREE)]

    async def exists(self, group_id: UUID) -> bool:
        return await self.conn.fetchval("SELECT EXISTS (SELECT 1 FROM device_groups WHERE id = $1)", group_id)

    async def subtree_ids(self, group_id: UUID) -> list[UUID]:
        """The group and all its descendants (empty if the group does not exist)."""
        return [r["id"] for r in await self.conn.fetch(_SUBTREE, group_id)]

    async def create(self, name: str, parent_id: UUID | None) -> UUID:
        try:
            return await self.conn.fetchval(
                "INSERT INTO device_groups (name, parent_id) VALUES ($1, $2) RETURNING id", name, parent_id
            )
        except asyncpg.ForeignKeyViolationError as e:
            raise Invalid("Parent group not found") from e
        except asyncpg.UniqueViolationError as e:
            raise Conflict(f'A group named "{name}" already exists here') from e

    async def update(self, group_id: UUID, fields: dict) -> bool:
        """Applies `fields` (name, parent_id). Returns False if the group does not exist."""
        if not fields:
            return await self.exists(group_id)
        cols = list(fields)
        sets = ", ".join(f"{c} = ${i + 2}" for i, c in enumerate(cols))
        try:
            status = await self.conn.execute(
                f"UPDATE device_groups SET {sets}, updated_at = now() WHERE id = $1",
                group_id,
                *(fields[c] for c in cols),
            )
        except asyncpg.ForeignKeyViolationError as e:
            raise Invalid("Parent group not found") from e
        except asyncpg.UniqueViolationError as e:
            raise Conflict("A group with this name already exists here") from e
        return status != "UPDATE 0"

    async def has_children(self, group_id: UUID) -> bool:
        return await self.conn.fetchval("SELECT EXISTS (SELECT 1 FROM device_groups WHERE parent_id = $1)", group_id)

    async def has_devices(self, group_id: UUID) -> bool:
        return await self.conn.fetchval("SELECT EXISTS (SELECT 1 FROM devices WHERE group_id = $1)", group_id)

    async def delete(self, group_id: UUID) -> bool:
        return await self.conn.execute("DELETE FROM device_groups WHERE id = $1", group_id) != "DELETE 0"
