from __future__ import annotations  # methods named `list` shadow the builtin in annotations

from typing import Protocol
from uuid import UUID

from ivms.core.errors import Conflict, NotFound

from .schemas import DeviceGroup, DeviceGroupCreate, DeviceGroupUpdate


class Repository(Protocol):
    async def tree(self) -> list[dict]: ...
    async def exists(self, group_id: UUID) -> bool: ...
    async def subtree_ids(self, group_id: UUID) -> list[UUID]: ...
    async def create(self, name: str, parent_id: UUID | None) -> UUID: ...
    async def update(self, group_id: UUID, fields: dict) -> bool: ...
    async def has_children(self, group_id: UUID) -> bool: ...
    async def has_devices(self, group_id: UUID) -> bool: ...
    async def delete(self, group_id: UUID) -> bool: ...


class DeviceGroupService:
    def __init__(self, repo: Repository):
        self.repo = repo

    async def list(self) -> list[DeviceGroup]:
        rows = await self.repo.tree()
        # Roll direct device counts up to every ancestor
        totals = {r["id"]: r["direct_devices"] for r in rows}
        parent = {r["id"]: r["parent_id"] for r in rows}
        for r in rows:
            p = r["parent_id"]
            while p is not None:
                totals[p] += r["direct_devices"]
                p = parent.get(p)
        return [DeviceGroup(**r, device_count=totals[r["id"]]) for r in rows]

    async def get(self, group_id: UUID) -> DeviceGroup:
        for g in await self.list():
            if g.id == group_id:
                return g
        raise NotFound("Device group not found")

    async def subtree_ids(self, group_id: UUID) -> list[UUID]:
        """Used by other features (devices, user scopes) to expand a group to its sub-groups."""
        return await self.repo.subtree_ids(group_id)

    async def create(self, data: DeviceGroupCreate) -> DeviceGroup:
        group_id = await self.repo.create(data.name, data.parent_id)
        return await self.get(group_id)

    async def update(self, group_id: UUID, data: DeviceGroupUpdate) -> DeviceGroup:
        fields = data.model_dump(include=data.model_fields_set)
        if fields.get("name") is None:
            fields.pop("name", None)  # name cannot be cleared
        new_parent = fields.get("parent_id")
        if new_parent is not None and new_parent in await self.repo.subtree_ids(group_id):
            raise Conflict("A group cannot be moved inside itself")
        if not await self.repo.update(group_id, fields):
            raise NotFound("Device group not found")
        return await self.get(group_id)

    async def delete(self, group_id: UUID) -> None:
        if not await self.repo.exists(group_id):
            raise NotFound("Device group not found")
        if await self.repo.has_children(group_id):
            raise Conflict("Delete or move its sub-groups first")
        if await self.repo.has_devices(group_id):
            raise Conflict("Move or delete its devices first")
        await self.repo.delete(group_id)
