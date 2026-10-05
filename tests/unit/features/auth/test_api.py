"""HTTP layer of auth and the bearer-token check every other route goes through."""

import pytest
from fastapi.testclient import TestClient

from ivms.app import create_app
from ivms.core.config import Settings
from ivms.core.deps import get_token_codec
from ivms.core.security import TokenCodec
from ivms.features.auth.controller import AuthController, get_controller
from ivms.features.devices.controller import get_controller as get_device_controller

from ..devices.fakes import make_controller as make_device_controller
from .fakes import FakeUserModel

TTL = 5  # seconds: short on purpose, the clock is fake


class FakeClock:
    now = 1_000_000.0

    def __call__(self):
        return self.now


@pytest.fixture
def clock():
    return FakeClock()


@pytest.fixture
async def client(clock):
    app = create_app(Settings())
    tokens = TokenCodec("test-jwt-secret-at-least-32-bytes!", TTL, clock)
    auth = AuthController(FakeUserModel(), tokens)
    await auth.create_user("admin", "Administrator", "correct-horse")
    devices, *_ = make_device_controller()
    app.dependency_overrides[get_token_codec] = lambda: tokens
    app.dependency_overrides[get_controller] = lambda: auth
    app.dependency_overrides[get_device_controller] = lambda: devices
    # Not used as a context manager: lifespan (DB pool, MediaMTX client) does not start
    return TestClient(app)


def login(client) -> str:
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "correct-horse"})
    assert r.status_code == 200
    return r.json()["accessToken"]


def test_login_returns_bearer_token_and_user(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "correct-horse"})

    body = r.json()
    assert body["tokenType"] == "bearer"
    assert body["expiresIn"] == TTL
    assert body["user"]["username"] == "admin"
    assert "passwordHash" not in body["user"]


def test_wrong_password_is_401_problem(client):
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "nope"})

    assert r.status_code == 401
    assert r.headers["content-type"] == "application/problem+json"
    assert r.headers["WWW-Authenticate"] == "Bearer"
    assert r.json()["detail"] == "Wrong username or password"


def test_me_with_token(client):
    token = login(client)

    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert r.status_code == 200
    assert r.json()["name"] == "Administrator"


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer garbage"}, {"Authorization": "Basic YTpi"}])
def test_api_routes_need_a_valid_token(client, headers):
    r = client.get("/api/v1/devices", headers=headers)

    assert r.status_code == 401
    assert r.headers["WWW-Authenticate"] == "Bearer"


def test_expired_token_must_sign_in_again(client, clock):
    headers = {"Authorization": f"Bearer {login(client)}"}
    assert client.get("/api/v1/devices", headers=headers).status_code == 200

    clock.now += TTL
    r = client.get("/api/v1/devices", headers=headers)

    assert r.status_code == 401
    assert r.json()["detail"] == "Session expired, please sign in again"
    # A fresh sign-in works again
    assert client.get("/api/v1/devices", headers={"Authorization": f"Bearer {login(client)}"}).status_code == 200
