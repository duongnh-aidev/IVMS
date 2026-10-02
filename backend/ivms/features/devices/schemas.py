from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, StringConstraints, field_validator

from ivms.core.schemas import ApiModel

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
# IPv4 / IPv6-free hostname; the frontend only offers IPv4 today
Host = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=253, pattern=r"^[A-Za-z0-9.\-]+$")]
Port = Annotated[int, Field(ge=1, le=65535)]
RtspPath = Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)]
Label = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]
DeviceStatus = Literal["online", "offline", "error"]
SortKey = Literal["name", "-name", "code", "-code", "status", "-status", "createdAt", "-createdAt"]


def _normalize_path(v: str | None) -> str | None:
    if v and not v.startswith("/"):
        return "/" + v
    return v


class Connection(ApiModel):
    host: Host
    port: Port = 554
    path: RtspPath = ""
    username: Label = ""
    password: str = Field(default="", max_length=200)

    _path = field_validator("path")(_normalize_path)


class DeviceCreate(Connection):
    name: Name
    group_id: UUID | None = None
    model: Label | None = None
    firmware: Label | None = None


class DeviceUpdate(ApiModel):
    """Omitted fields are unchanged. Omit `password` to keep the stored one."""

    name: Name | None = None
    host: Host | None = None
    port: Port | None = None
    path: RtspPath | None = None
    username: Label | None = None
    password: str | None = Field(default=None, max_length=200)
    group_id: UUID | None = None
    model: Label | None = None
    firmware: Label | None = None

    _path = field_validator("path")(_normalize_path)


class Device(ApiModel):
    id: UUID
    code: str
    name: str
    host: str
    port: int
    path: str
    username: str
    has_password: bool
    group_id: UUID | None
    model: str | None
    firmware: str | None
    status: DeviceStatus
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ProbeRequest(Connection):
    """Connection to test. With `deviceId` and no `password`, the device's stored password is used."""

    device_id: UUID | None = None
    password: str | None = Field(default=None, max_length=200)


class ProbeResponse(ApiModel):
    reachable: bool
    codec: str | None = None
    error: str | None = None
