from uuid import uuid4

import pytest

from ivms.core.errors import Conflict, NotFound
from ivms.features.device_groups.controller import DeviceGroupController
from ivms.features.device_groups.view import DeviceGroupCreate, DeviceGroupUpdate


class FakeGroupModel:
    def __init__(self):
        self.groups: dict = {}  # id → {name, parent_id}
        self.devices: dict = {}  # group id → device count

    async def tree(self):
        def walk(parent, depth):
            kids = sorted((g for g in self.groups.items() if g[1]["parent_id"] == parent), key=lambda g: g[1]["name"])
            for gid, g in kids:
                yield {"id": gid, **g, "depth": depth, "direct_devices": self.devices.get(gid, 0)}
                yield from walk(gid, depth + 1)

        return list(walk(None, 0))

    async def exists(self, group_id):
        return group_id in self.groups

    async def subtree_ids(self, group_id):
        if group_id not in self.groups:
            return []
        out = [group_id]
        for gid, g in self.groups.items():
            if g["parent_id"] == group_id:
                out += await self.subtree_ids(gid)
        return out

    async def create(self, name, parent_id):
        gid = uuid4()
        self.groups[gid] = {"name": name, "parent_id": parent_id}
        return gid

    async def update(self, group_id, fields):
        if group_id not in self.groups:
            return False
        self.groups[group_id].update(fields)
        return True

    async def has_children(self, group_id):
        return any(g["parent_id"] == group_id for g in self.groups.values())

    async def has_devices(self, group_id):
        return self.devices.get(group_id, 0) > 0

    async def delete(self, group_id):
        return self.groups.pop(group_id, None) is not None


@pytest.fixture
async def site():
    """Head Office > Building A > Floor 1, with 2 devices on Floor 1 and 1 in Building A."""
    model = FakeGroupModel()
    controller = DeviceGroupController(model)
    hq = await controller.create(DeviceGroupCreate(name="Head Office"))
    a = await controller.create(DeviceGroupCreate(name="Building A", parent_id=hq.id))
    f1 = await controller.create(DeviceGroupCreate(name="Floor 1", parent_id=a.id))
    model.devices = {f1.id: 2, a.id: 1}
    return controller, model, hq, a, f1


async def test_list_is_a_tree_with_rolled_up_counts(site):
    controller, *_ = site

    groups = await controller.list()

    assert [(g.name, g.depth, g.device_count) for g in groups] == [
        ("Head Office", 0, 3),
        ("Building A", 1, 3),
        ("Floor 1", 2, 2),
    ]


async def test_cannot_move_group_inside_itself(site):
    controller, _, hq, _, f1 = site

    with pytest.raises(Conflict):
        await controller.update(hq.id, DeviceGroupUpdate(parent_id=f1.id))


async def test_move_to_top_level(site):
    controller, _, _, a, _ = site

    moved = await controller.update(a.id, DeviceGroupUpdate.model_validate({"parentId": None}))

    assert moved.parent_id is None and moved.depth == 0


async def test_delete_rules(site):
    controller, model, _, a, f1 = site

    with pytest.raises(Conflict, match="sub-groups"):
        await controller.delete(a.id)
    with pytest.raises(Conflict, match="devices"):
        await controller.delete(f1.id)
    model.devices = {}
    await controller.delete(f1.id)
    with pytest.raises(NotFound):
        await controller.delete(f1.id)
