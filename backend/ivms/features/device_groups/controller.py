from __future__ import annotations  # methods named `list` shadow the builtin in annotations

from typing import Annotated, Protocol
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status

from ivms.core.db import Conn
from ivms.core.deps import require
from ivms.core.errors import Conflict, NotFound

from .model import DeviceGroupModel
from .view import DeviceGroup, DeviceGroupCreate, DeviceGroupUpdate


class Model(Protocol):
    async def tree(self) -> list[dict]: ...
    async def exists(self, group_id: UUID) -> bool: ...
    async def subtree_ids(self, group_id: UUID) -> list[UUID]: ...
    async def create(self, name: str, parent_id: UUID | None) -> UUID: ...
    async def update(self, group_id: UUID, fields: dict) -> bool: ...
    async def has_children(self, group_id: UUID) -> bool: ...
    async def has_devices(self, group_id: UUID) -> bool: ...
    async def delete(self, group_id: UUID) -> bool: ...


class DeviceGroupController:
    def __init__(self, model: Model):
        self.model = model

    async def list(self) -> list[DeviceGroup]:
        rows = await self.model.tree()
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
        return await self.model.subtree_ids(group_id)

    async def create(self, data: DeviceGroupCreate) -> DeviceGroup:
        group_id = await self.model.create(data.name, data.parent_id)
        return await self.get(group_id)

    async def update(self, group_id: UUID, data: DeviceGroupUpdate) -> DeviceGroup:
        fields = data.model_dump(include=data.model_fields_set)
        if fields.get("name") is None:
            fields.pop("name", None)  # name cannot be cleared
        new_parent = fields.get("parent_id")
        if new_parent is not None and new_parent in await self.model.subtree_ids(group_id):
            raise Conflict("A group cannot be moved inside itself")
        if not await self.model.update(group_id, fields):
            raise NotFound("Device group not found")
        return await self.get(group_id)

    async def delete(self, group_id: UUID) -> None:
        if not await self.model.exists(group_id):
            raise NotFound("Device group not found")
        if await self.model.has_children(group_id):
            raise Conflict("Delete or move its sub-groups first")
        if await self.model.has_devices(group_id):
            raise Conflict("Move or delete its devices first")
        await self.model.delete(group_id)


# ---- HTTP routes ----

router = APIRouter(prefix="/device-groups", tags=["device-groups"])


def get_controller(conn: Conn) -> DeviceGroupController:
    return DeviceGroupController(DeviceGroupModel(conn))


Controller = Annotated[DeviceGroupController, Depends(get_controller)]


@router.get("", dependencies=[require("live")])
async def list_groups(controller: Controller) -> list[DeviceGroup]:
    return await controller.list()


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[require("devices")])
async def create_group(
    data: DeviceGroupCreate, controller: Controller, request: Request, response: Response
) -> DeviceGroup:
    group = await controller.create(data)
    response.headers["Location"] = str(request.url_for("get_group", group_id=group.id))
    return group


@router.get("/{group_id}", dependencies=[require("live")])
async def get_group(group_id: UUID, controller: Controller) -> DeviceGroup:
    return await controller.get(group_id)


@router.patch("/{group_id}", dependencies=[require("devices")])
async def update_group(group_id: UUID, data: DeviceGroupUpdate, controller: Controller) -> DeviceGroup:
    return await controller.update(group_id, data)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[require("devices")])
async def delete_group(group_id: UUID, controller: Controller) -> None:
    await controller.delete(group_id)
