from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response, status

from ivms.core.crypto import SecretBox
from ivms.core.db import Conn
from ivms.core.deps import require
from ivms.core.schemas import Page
from ivms.features.device_groups.router import get_service as get_group_service
from ivms.features.streams import MediaMTX, probe

from .repository import DeviceRepository
from .schemas import Device, DeviceCreate, DeviceStatus, DeviceUpdate, ProbeRequest, ProbeResponse, SortKey
from .service import DeviceService

router = APIRouter(prefix="/devices", tags=["devices"])


def get_service(conn: Conn, request: Request) -> DeviceService:
    state = request.app.state
    return DeviceService(
        repo=DeviceRepository(conn),
        groups=get_group_service(conn),
        relay=MediaMTX(state.mediamtx_http),
        prober=probe,
        secrets=SecretBox(state.settings.secret_key),
    )


Service = Annotated[DeviceService, Depends(get_service)]


@router.get("", dependencies=[require("live")])
async def list_devices(
    service: Service,
    group_id: Annotated[UUID | None, Query(alias="groupId")] = None,
    status: DeviceStatus | None = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    sort: SortKey = "code",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[Device]:
    return await service.list(group_id=group_id, status=status, q=q, sort=sort, limit=limit, offset=offset)


@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[require("devices")])
async def create_device(data: DeviceCreate, service: Service, request: Request, response: Response) -> Device:
    device = await service.create(data)
    response.headers["Location"] = str(request.url_for("get_device", device_id=device.id))
    return device


# Declared before /{device_id} so "probe" is not parsed as an ID
@router.post("/probe", dependencies=[require("devices")])
async def probe_device(data: ProbeRequest, service: Service) -> ProbeResponse:
    return await service.probe(data)


@router.get("/{device_id}", dependencies=[require("live")])
async def get_device(device_id: UUID, service: Service) -> Device:
    return await service.get(device_id)


@router.patch("/{device_id}", dependencies=[require("devices")])
async def update_device(device_id: UUID, data: DeviceUpdate, service: Service) -> Device:
    return await service.update(device_id, data)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[require("devices")])
async def delete_device(device_id: UUID, service: Service) -> None:
    await service.delete(device_id)
