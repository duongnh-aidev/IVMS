from __future__ import annotations  # methods named `list` shadow the builtin in annotations

from collections.abc import Awaitable, Callable
from contextlib import AbstractAsyncContextManager
from typing import Protocol
from uuid import UUID

from ivms.core.crypto import SecretBox
from ivms.core.errors import Invalid, NotFound
from ivms.core.schemas import Page
from ivms.features.streams import ProbeResult, RtspTarget, path_name

from .schemas import Device, DeviceCreate, DeviceUpdate, ProbeRequest, ProbeResponse

# Changing any of these re-registers the camera with the stream relay
CONNECTION_FIELDS = {"host", "port", "path", "username", "password_enc"}


class Repository(Protocol):
    def transaction(self) -> AbstractAsyncContextManager: ...
    async def list(self, **filters) -> tuple[list[dict], int]: ...
    async def get(self, device_id: UUID) -> dict | None: ...
    async def get_connection(self, device_id: UUID) -> dict | None: ...
    async def create(self, fields: dict) -> UUID: ...
    async def update(self, device_id: UUID, fields: dict) -> bool: ...
    async def delete(self, device_id: UUID) -> bool: ...


class GroupTree(Protocol):
    async def subtree_ids(self, group_id: UUID) -> list[UUID]: ...


class StreamRelay(Protocol):
    async def publish(self, path: str, source: str) -> None: ...
    async def unpublish(self, path: str) -> None: ...


Prober = Callable[[RtspTarget], Awaitable[ProbeResult]]


def _to_device(row: dict) -> Device:
    return Device(**row, code=f"CAM-{row['seq']:02d}")


class DeviceService:
    def __init__(self, repo: Repository, groups: GroupTree, relay: StreamRelay, prober: Prober, secrets: SecretBox):
        self.repo = repo
        self.groups = groups
        self.relay = relay
        self.prober = prober
        self.secrets = secrets

    async def list(
        self,
        *,
        group_id: UUID | None = None,
        status: str | None = None,
        q: str | None = None,
        sort: str = "code",
        limit: int = 50,
        offset: int = 0,
    ) -> Page[Device]:
        group_ids = None
        if group_id is not None:
            group_ids = await self.groups.subtree_ids(group_id)
            if not group_ids:
                raise Invalid("Device group not found")
        rows, total = await self.repo.list(
            group_ids=group_ids, status=status, q=q, sort=sort, limit=limit, offset=offset
        )
        return Page[Device](items=[_to_device(r) for r in rows], total=total, limit=limit, offset=offset)

    async def get(self, device_id: UUID) -> Device:
        row = await self.repo.get(device_id)
        if row is None:
            raise NotFound("Device not found")
        return _to_device(row)

    async def create(self, data: DeviceCreate) -> Device:
        fields = data.model_dump(exclude={"password"})
        fields["password_enc"] = self.secrets.encrypt(data.password) if data.password else None
        # The device only exists if the relay accepted it: a relay error rolls the insert back
        async with self.repo.transaction():
            device_id = await self.repo.create(fields)
            await self._publish(device_id)
        return await self.get(device_id)

    async def update(self, device_id: UUID, data: DeviceUpdate) -> Device:
        fields = {k: v for k, v in data.model_dump(include=data.model_fields_set).items() if v is not None}
        if "group_id" in data.model_fields_set:
            fields["group_id"] = data.group_id  # null = ungrouped
        if "password" in fields:
            pw = fields.pop("password")
            fields["password_enc"] = self.secrets.encrypt(pw) if pw else None
        async with self.repo.transaction():
            if not await self.repo.update(device_id, fields):
                raise NotFound("Device not found")
            if CONNECTION_FIELDS & fields.keys():
                await self._publish(device_id)
        return await self.get(device_id)

    async def delete(self, device_id: UUID) -> None:
        async with self.repo.transaction():
            if not await self.repo.delete(device_id):
                raise NotFound("Device not found")
            await self.relay.unpublish(path_name(device_id))

    async def probe(self, data: ProbeRequest) -> ProbeResponse:
        password = data.password
        if password is None and data.device_id is not None:
            saved = await self.repo.get_connection(data.device_id)
            if saved is None:
                raise NotFound("Device not found")
            password = self._decrypt(saved["password_enc"])
        target = RtspTarget(data.host, data.port, data.path, data.username, password or "")
        result = await self.prober(target)
        return ProbeResponse(reachable=result.reachable, codec=result.codec, error=result.error)

    async def _publish(self, device_id: UUID) -> None:
        c = await self.repo.get_connection(device_id)
        target = RtspTarget(c["host"], c["port"], c["path"], c["username"], self._decrypt(c["password_enc"]))
        await self.relay.publish(path_name(device_id), target.url)

    def _decrypt(self, token: str | None) -> str:
        return self.secrets.decrypt(token) if token else ""
