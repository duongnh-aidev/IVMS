"""In-memory stand-ins for the devices feature's dependencies."""

from contextlib import asynccontextmanager
from datetime import UTC, datetime
from uuid import UUID, uuid4

from ivms.core.crypto import SecretBox
from ivms.core.errors import UpstreamError
from ivms.features.devices.controller import DeviceController
from ivms.features.streams import ProbeResult


class FakeDeviceModel:
    """Rolls back writes made inside a failed transaction, like PostgreSQL would."""

    def __init__(self):
        self.rows: dict[UUID, dict] = {}
        self._seq = 0

    @asynccontextmanager
    async def transaction(self):
        snapshot = {k: dict(v) for k, v in self.rows.items()}
        try:
            yield
        except BaseException:
            self.rows = snapshot
            raise

    async def list(self, *, group_ids, status, q, sort, limit, offset):
        rows = [r for r in self.rows.values() if group_ids is None or r["group_id"] in group_ids]
        rows = [r for r in rows if not status or r["status"] == status]
        rows = [r for r in rows if not q or q.lower() in r["name"].lower()]
        return [self._public(r) for r in rows[offset : offset + limit]], len(rows)

    async def get(self, device_id):
        r = self.rows.get(device_id)
        return self._public(r) if r else None

    async def get_connection(self, device_id):
        r = self.rows.get(device_id)
        return {k: r[k] for k in ("host", "port", "path", "username", "password_enc")} if r else None

    async def create(self, fields):
        self._seq += 1
        now = datetime.now(UTC)
        device_id = uuid4()
        self.rows[device_id] = {
            "path": "",
            "username": "",
            "password_enc": None,
            "group_id": None,
            "model": None,
            "firmware": None,
            **fields,
            "id": device_id,
            "seq": self._seq,
            "status": "offline",
            "last_seen_at": None,
            "created_at": now,
            "updated_at": now,
        }
        return device_id

    async def update(self, device_id, fields):
        if device_id not in self.rows:
            return False
        self.rows[device_id].update(fields)
        return True

    async def delete(self, device_id):
        return self.rows.pop(device_id, None) is not None

    @staticmethod
    def _public(r):
        out = {k: v for k, v in r.items() if k != "password_enc"}
        out["has_password"] = bool(r["password_enc"])
        return out


class FakeGroups:
    def __init__(self, tree: dict[UUID, list[UUID]] | None = None):
        self.tree = tree or {}  # group id → its subtree ids

    async def subtree_ids(self, group_id):
        return self.tree.get(group_id, [])


class FakeRelay:
    def __init__(self):
        self.paths: dict[str, str] = {}
        self.fail = False

    async def publish(self, path, source):
        if self.fail:
            raise UpstreamError("MediaMTX is unreachable")
        self.paths[path] = source

    async def unpublish(self, path):
        if self.fail:
            raise UpstreamError("MediaMTX is unreachable")
        self.paths.pop(path, None)


class FakeProber:
    def __init__(self, result: ProbeResult | None = None):
        self.result = result or ProbeResult(True, codec="H.264")
        self.calls = []

    async def __call__(self, target):
        self.calls.append(target)
        return self.result


def make_controller(groups: FakeGroups | None = None):
    model, relay, prober = FakeDeviceModel(), FakeRelay(), FakeProber()
    controller = DeviceController(model, groups or FakeGroups(), relay, prober, SecretBox("test-secret"))
    return controller, model, relay, prober
