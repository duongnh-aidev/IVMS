from uuid import uuid4

import pytest

from ivms.core.errors import Invalid, NotFound, UpstreamError
from ivms.features.devices.view import DeviceCreate, DeviceUpdate, ProbeRequest
from ivms.features.streams import path_name

from .fakes import FakeGroups, make_controller

LOBBY = DeviceCreate(name=" Lobby ", host="192.168.1.102", path="Streaming/101", username="admin", password="p@ss:1")


async def test_create_registers_relay_path_with_credentials():
    controller, model, relay, _ = make_controller()

    device = await controller.create(LOBBY)

    assert device.name == "Lobby"
    assert device.code == "CAM-01"
    assert device.path == "/Streaming/101"
    assert device.has_password
    # Password is URL-encoded in the source and never stored in clear
    assert relay.paths[path_name(device.id)] == "rtsp://admin:p%40ss%3A1@192.168.1.102:554/Streaming/101"
    assert "p@ss:1" not in str(model.rows[device.id]["password_enc"])


async def test_create_is_rolled_back_when_relay_fails():
    controller, model, relay, _ = make_controller()
    relay.fail = True

    with pytest.raises(UpstreamError):
        await controller.create(LOBBY)

    assert model.rows == {}


async def test_update_without_password_keeps_stored_one():
    controller, _, relay, _ = make_controller()
    device = await controller.create(LOBBY)

    updated = await controller.update(device.id, DeviceUpdate(host="10.0.0.5"))

    assert updated.host == "10.0.0.5"
    assert updated.has_password
    assert relay.paths[path_name(device.id)] == "rtsp://admin:p%40ss%3A1@10.0.0.5:554/Streaming/101"


async def test_update_name_only_does_not_touch_relay():
    controller, _, relay, _ = make_controller()
    device = await controller.create(LOBBY)
    relay.paths.clear()

    updated = await controller.update(device.id, DeviceUpdate(name="Main lobby"))

    assert updated.name == "Main lobby"
    assert relay.paths == {}


async def test_update_can_ungroup_and_clear_password():
    group = uuid4()
    controller, _, relay, _ = make_controller()
    device = await controller.create(LOBBY.model_copy(update={"group_id": group}))

    updated = await controller.update(device.id, DeviceUpdate.model_validate({"groupId": None, "password": ""}))

    assert updated.group_id is None
    assert not updated.has_password
    assert relay.paths[path_name(device.id)] == "rtsp://admin:@192.168.1.102:554/Streaming/101"


async def test_update_and_delete_unknown_device():
    controller, *_ = make_controller()

    with pytest.raises(NotFound):
        await controller.update(uuid4(), DeviceUpdate(name="x"))
    with pytest.raises(NotFound):
        await controller.delete(uuid4())


async def test_delete_removes_relay_path():
    controller, model, relay, _ = make_controller()
    device = await controller.create(LOBBY)

    await controller.delete(device.id)

    assert model.rows == {}
    assert relay.paths == {}


async def test_list_by_group_includes_sub_groups():
    building, floor, other = uuid4(), uuid4(), uuid4()
    controller, *_ = make_controller(FakeGroups({building: [building, floor]}))
    await controller.create(LOBBY.model_copy(update={"group_id": floor}))
    await controller.create(DeviceCreate(name="Gate", host="192.168.1.101", group_id=other))

    page = await controller.list(group_id=building)

    assert [d.name for d in page.items] == ["Lobby"]
    assert page.total == 1


async def test_list_by_unknown_group_is_invalid():
    controller, *_ = make_controller()

    with pytest.raises(Invalid):
        await controller.list(group_id=uuid4())


async def test_probe_uses_stored_password_when_omitted():
    controller, _, _, prober = make_controller()
    device = await controller.create(LOBBY)

    result = await controller.probe(ProbeRequest(host="192.168.1.102", username="admin", device_id=device.id))

    assert result.reachable and result.codec == "H.264"
    assert prober.calls[-1].password == "p@ss:1"
