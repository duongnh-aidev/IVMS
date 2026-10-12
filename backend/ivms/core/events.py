"""In-process events: core features announce changes, plugins react (docs/plugins.md, "Events").

Events are published after the change is committed. Handlers run in the request that caused the
change, one after another; a failing handler is logged and never fails that request. Handlers that
need more time should start their own background task.
"""

import logging
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

log = logging.getLogger("ivms.events")

# Every event the core publishes, with its `data` keys
EVENTS = {
    # device: Device as JSON (snake_case keys, no password), stream_path: MediaMTX path to read over RTSP
    "device.created": ("device", "stream_path"),
    # device and stream_path as above, changed: names of the fields the request changed
    "device.updated": ("device", "stream_path", "changed"),
    "device.deleted": ("device_id", "stream_path"),
}


@dataclass(frozen=True)
class Event:
    name: str
    data: Mapping[str, Any]


EventHandler = Callable[[Event], Awaitable[None]]


class EventBus:
    """`handlers` are (subscriber name, event name, handler), called in that order."""

    def __init__(self, handlers: Sequence[tuple[str, str, EventHandler]] = ()):
        self._handlers: dict[str, list[tuple[str, EventHandler]]] = {}
        for subscriber, name, handler in handlers:
            self._handlers.setdefault(name, []).append((subscriber, handler))

    async def publish(self, name: str, **data: Any) -> None:
        if name not in EVENTS:
            raise ValueError(f"Unknown event: {name}")
        event = Event(name, data)
        for subscriber, handler in self._handlers.get(name, ()):
            try:
                await handler(event)
            except Exception:
                log.exception("%s failed to handle %s", subscriber, name)
