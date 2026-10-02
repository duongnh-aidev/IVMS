from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status

from ivms.core.db import Conn
from ivms.core.deps import require

from .repository import DeviceGroupRepository
from .schemas import DeviceGroup, DeviceGroupCreate, DeviceGroupUpdate
from .service import DeviceGroupService

router = APIRouter(prefix="/device-groups", tags=["device-groups"])


def get_service(conn: Conn) -> DeviceGroupService:
    return DeviceGroupService(DeviceGroupRepository(conn))


Service = Annotated[DeviceGroupService, Depends(get_service)]


@router.get("", dependencies=[require("live")])
async def list_groups(service: Service) -> list[DeviceGroup]:
    return await service.list()


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[require("devices")])
async def create_group(data: DeviceGroupCreate, service: Service, request: Request, response: Response) -> DeviceGroup:
    group = await service.create(data)
    response.headers["Location"] = str(request.url_for("get_group", group_id=group.id))
    return group


@router.get("/{group_id}", dependencies=[require("live")])
async def get_group(group_id: UUID, service: Service) -> DeviceGroup:
    return await service.get(group_id)


@router.patch("/{group_id}", dependencies=[require("devices")])
async def update_group(group_id: UUID, data: DeviceGroupUpdate, service: Service) -> DeviceGroup:
    return await service.update(group_id, data)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[require("devices")])
async def delete_group(group_id: UUID, service: Service) -> None:
    await service.delete(group_id)
