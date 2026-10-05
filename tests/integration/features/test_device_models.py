"""SQL of the device_groups and devices models against a real database."""

from uuid import uuid4

import pytest

from ivms.core.errors import Conflict, Invalid
from ivms.features.device_groups.model import DeviceGroupModel
from ivms.features.devices.model import DeviceModel


@pytest.fixture
def groups(conn):
    return DeviceGroupModel(conn)


@pytest.fixture
def devices(conn):
    return DeviceModel(conn)


async def test_group_tree_order_and_subtree(groups, devices):
    hq = await groups.create("Head Office", None)
    b = await groups.create("Building B", hq)
    a = await groups.create("Building A", hq)
    wh = await groups.create("Warehouse", None)
    await devices.create({"name": "Lobby", "host": "10.0.0.1", "group_id": a})

    tree = [(r["name"], r["depth"], r["direct_devices"]) for r in await groups.tree()]

    assert tree == [("Head Office", 0, 0), ("Building A", 1, 1), ("Building B", 1, 0), ("Warehouse", 0, 0)]
    assert set(await groups.subtree_ids(hq)) == {hq, a, b}
    assert await groups.subtree_ids(wh) == [wh]
    assert await groups.has_children(hq) and await groups.has_devices(a)


async def test_group_constraints(conn, groups):
    hq = await groups.create("Head Office", None)
    await groups.create("Building A", hq)

    # Each failing statement in its own savepoint: an error aborts the enclosing transaction
    with pytest.raises(Conflict):
        async with conn.transaction():
            await groups.create("Building A", hq)
    with pytest.raises(Invalid):
        async with conn.transaction():
            await groups.create("Orphan", uuid4())


async def test_device_crud(devices):
    device_id = await devices.create(
        {"name": "Lobby", "host": "10.0.0.1", "port": 554, "path": "/s", "username": "admin", "password_enc": "x"}
    )

    row = await devices.get(device_id)
    assert row["name"] == "Lobby" and row["status"] == "offline" and row["has_password"]
    assert "password_enc" not in row
    assert (await devices.get_connection(device_id))["password_enc"] == "x"

    assert await devices.update(device_id, {"name": "Main lobby", "password_enc": None})
    row = await devices.get(device_id)
    assert row["name"] == "Main lobby" and not row["has_password"]

    assert await devices.delete(device_id)
    assert await devices.get(device_id) is None
    assert not await devices.update(device_id, {"name": "x"})


async def test_device_unique_address_and_group_fk(conn, devices):
    await devices.create({"name": "A", "host": "10.0.0.1", "path": "/s"})

    with pytest.raises(Conflict):
        async with conn.transaction():
            await devices.create({"name": "B", "host": "10.0.0.1", "path": "/s"})
    with pytest.raises(Invalid):
        async with conn.transaction():
            await devices.create({"name": "C", "host": "10.0.0.2", "group_id": uuid4()})


async def test_device_list_filters_sort_and_paging(groups, devices):
    g = await groups.create("Floor 1", None)
    for i, name in enumerate(["Gate", "lobby", "Parking 100%"]):
        await devices.create({"name": name, "host": f"10.0.0.{i + 1}", "group_id": g if i < 2 else None})

    rows, total = await devices.list(group_ids=[g], status=None, q=None, sort="-name", limit=50, offset=0)
    assert [r["name"] for r in rows] == ["lobby", "Gate"] and total == 2

    rows, total = await devices.list(group_ids=None, status="offline", q="100%", sort="code", limit=50, offset=0)
    assert [r["name"] for r in rows] == ["Parking 100%"]

    rows, total = await devices.list(group_ids=None, status=None, q=None, sort="code", limit=1, offset=5)
    assert rows == [] and total == 3
