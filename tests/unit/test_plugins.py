"""Plugin contract: plugins add routes, permissions and features, and never replace the core's."""

from contextlib import asynccontextmanager
from types import SimpleNamespace

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient

import ivms.app
import ivms.plugins
from ivms.app import create_app
from ivms.core.config import Settings
from ivms.core.deps import require
from ivms.plugins import PLUGIN_API_VERSION, Plugin, PluginError, discover, require_feature


class Licence:
    """Stands in for a plugin's licence check: features can be switched on at runtime."""

    def __init__(self):
        self.features = set()

    def __call__(self):
        return self.features


def make_plugin(name="acme", routers=(), **kwargs) -> Plugin:
    return Plugin(name=name, api_version=PLUGIN_API_VERSION, routers=routers, **kwargs)


def detections_router() -> APIRouter:
    router = APIRouter(prefix="/detections", tags=["detections"])

    @router.get("", dependencies=[require_feature("acme.detections")])
    async def list_detections():
        return {"items": []}

    return router


def client_for(*plugins) -> TestClient:
    return TestClient(create_app(Settings(), plugins=plugins))


def test_without_plugins_the_app_is_community():
    r = client_for().get("/api/v1/system/info")

    assert r.status_code == 200
    assert r.json() | {"version": None} == {"version": None, "edition": "Community", "features": []}


def test_feature_routes_answer_403_until_the_feature_is_enabled():
    licence = Licence()
    client = client_for(make_plugin(routers=[detections_router()], features=licence, edition="Enterprise"))

    r = client.get("/api/v1/detections")
    assert r.status_code == 403
    assert r.headers["content-type"] == "application/problem+json"
    assert client.get("/api/v1/system/info").json()["edition"] == "Community"

    licence.features = {"acme.detections"}  # e.g. a licence key was entered: no restart needed

    assert client.get("/api/v1/detections").json() == {"items": []}
    info = client.get("/api/v1/system/info").json()
    assert info["edition"] == "Enterprise"
    assert info["features"] == ["acme.detections"]


def test_a_failing_feature_check_disables_the_plugin_not_the_app():
    def broken():
        raise OSError("licence file unreadable")

    client = client_for(make_plugin(routers=[detections_router()], features=broken, edition="Enterprise"))

    assert client.get("/api/v1/detections").status_code == 403
    assert client.get("/api/v1/system/info").json()["edition"] == "Community"


def test_plugin_permissions_can_be_declared_on_its_routes():
    router = APIRouter(prefix="/rules")

    @router.get("", dependencies=[require("rules")])
    async def list_rules():
        return []

    client = client_for(make_plugin(routers=[router], permissions=["rules"]))

    assert client.get("/api/v1/rules").status_code == 401  # mounted, behind sign-in like core routes


def test_undeclared_permission_stops_the_app():
    router = APIRouter(prefix="/rules")

    @router.get("", dependencies=[require("rulez")])
    async def list_rules():
        return []

    with pytest.raises(ValueError, match="rulez"):
        create_app(Settings(), plugins=[make_plugin(routers=[router])])


def test_plugin_cannot_replace_a_core_route():
    router = APIRouter(prefix="/devices")

    @router.get("/{camera}")  # same as core GET /devices/{device_id}
    async def get_device(camera: str):
        return {}

    with pytest.raises(PluginError, match="GET /api/v1/devices/{}"):
        create_app(Settings(), plugins=[make_plugin(routers=[router])])


def test_plugins_cannot_replace_each_others_routes():
    with pytest.raises(PluginError, match="GET /api/v1/detections"):
        client_for(make_plugin("a", [detections_router()]), make_plugin("b", [detections_router()]))


@pytest.mark.parametrize(
    "plugins",
    [
        [make_plugin("a"), make_plugin("a")],
        [make_plugin(permissions=["devices"])],  # core permission
        [make_plugin("a", permissions=["rules"]), make_plugin("b", permissions=["rules"])],
    ],
    ids=["same name", "core permission", "permission of another plugin"],
)
def test_clashing_plugins_stop_the_app(plugins):
    with pytest.raises(PluginError):
        create_app(Settings(), plugins=plugins)


def test_plugin_lifespan_runs_inside_the_core_resources(monkeypatch):
    calls = []

    class FakePool:
        async def close(self):
            calls.append("core closed")

    async def fake_create_pool(_dsn):
        calls.append("core opened")
        return FakePool()

    @asynccontextmanager
    async def lifespan(app):
        calls.append(f"plugin opened, pool={type(app.state.pool).__name__}")
        yield
        calls.append("plugin closed")

    monkeypatch.setattr(ivms.app, "create_pool", fake_create_pool)
    with client_for(make_plugin(lifespan=lifespan)):
        pass

    assert calls == ["core opened", "plugin opened, pool=FakePool", "plugin closed", "core closed"]


def test_discover_skips_broken_and_incompatible_plugins(monkeypatch, caplog):
    def entry_point(name, loaded):
        def load():
            if isinstance(loaded, Exception):
                raise loaded
            return loaded

        return SimpleNamespace(name=name, value=f"{name}:plugin", load=load)

    good = make_plugin("good")
    eps = [
        entry_point("good", good),
        entry_point("old", Plugin(name="old", api_version=PLUGIN_API_VERSION - 1)),
        entry_point("crashes", ImportError("missing dependency")),
        entry_point("wrong", object()),
    ]
    monkeypatch.setattr(ivms.plugins, "entry_points", lambda group: eps if group == "ivms.plugins" else [])

    assert discover() == [good]
    assert {"old", "crashes", "wrong:plugin"} <= {word.strip(",;") for word in caplog.text.split()}
