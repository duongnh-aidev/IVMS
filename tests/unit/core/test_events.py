"""The in-process event bus plugins subscribe to."""

import logging

import pytest

from ivms.core.events import Event, EventBus


async def test_handlers_run_in_order_and_a_failing_one_does_not_stop_the_others(caplog):
    calls = []

    async def first(event):
        calls.append(("first", event))

    async def broken(_):
        raise RuntimeError("boom")

    async def last(event):
        calls.append(("last", event))

    bus = EventBus([("a", "device.deleted", first), ("b", "device.deleted", broken), ("c", "device.deleted", last)])

    with caplog.at_level(logging.ERROR, logger="ivms.events"):
        await bus.publish("device.deleted", device_id="1", stream_path="cam-1")  # does not raise

    event = Event("device.deleted", {"device_id": "1", "stream_path": "cam-1"})
    assert calls == [("first", event), ("last", event)]
    assert "b failed to handle device.deleted" in caplog.text


async def test_events_nobody_handles_are_fine():
    await EventBus().publish("device.created", device={}, stream_path="cam-1")


async def test_unknown_event_is_a_bug():
    with pytest.raises(ValueError, match="Unknown event"):
        await EventBus().publish("device.exploded")
