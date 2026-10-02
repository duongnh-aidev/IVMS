import httpx
import pytest

from ivms.core.errors import UpstreamError
from ivms.features.streams import MediaMTX


def relay(handler) -> MediaMTX:
    return MediaMTX(httpx.AsyncClient(base_url="http://mediamtx", transport=httpx.MockTransport(handler)))


async def test_publish_adds_when_path_is_new():
    calls = []

    def handler(req: httpx.Request):
        calls.append((req.method, req.url.path))
        return httpx.Response(404 if "replace" in req.url.path else 200)

    await relay(handler).publish("cam-1", "rtsp://cam")

    assert calls == [("POST", "/v3/config/paths/replace/cam-1"), ("POST", "/v3/config/paths/add/cam-1")]


async def test_publish_replaces_existing_path():
    calls = []

    def handler(req: httpx.Request):
        calls.append(req.url.path)
        assert req.read() == b'{"source":"rtsp://cam","sourceOnDemand":false}'
        return httpx.Response(200)

    await relay(handler).publish("cam-1", "rtsp://cam")

    assert calls == ["/v3/config/paths/replace/cam-1"]


async def test_unpublish_ignores_missing_path():
    await relay(lambda req: httpx.Response(404)).unpublish("cam-1")


async def test_errors_become_upstream_errors():
    with pytest.raises(UpstreamError, match="rejected"):
        await relay(lambda req: httpx.Response(400, text="bad source")).publish("cam-1", "x")

    def down(req):
        raise httpx.ConnectError("refused")

    with pytest.raises(UpstreamError, match="unreachable"):
        await relay(down).unpublish("cam-1")
