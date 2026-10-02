"""HTTP layer: wire format, status codes and error responses (service backed by fakes)."""

import pytest
from fastapi.testclient import TestClient

from ivms.app import create_app
from ivms.core.config import Settings
from ivms.features.devices.router import get_service

from .fakes import make_service


@pytest.fixture
def client():
    app = create_app(Settings())
    service, *_ = make_service()
    app.dependency_overrides[get_service] = lambda: service
    # Not used as a context manager: lifespan (DB pool, MediaMTX client) does not start
    return TestClient(app)


def test_create_returns_201_camel_case_and_location(client):
    r = client.post(
        "/api/v1/devices", json={"name": "Lobby", "host": "192.168.1.102", "username": "admin", "password": "x"}
    )

    assert r.status_code == 201
    body = r.json()
    assert body["code"] == "CAM-01"
    assert body["hasPassword"] is True
    assert "password" not in body and "passwordEnc" not in body
    assert r.headers["Location"].endswith(f"/api/v1/devices/{body['id']}")
    assert client.get(r.headers["Location"]).json()["name"] == "Lobby"


def test_list_is_paginated(client):
    for i in range(3):
        client.post("/api/v1/devices", json={"name": f"Cam {i}", "host": f"10.0.0.{i + 1}"})

    body = client.get("/api/v1/devices", params={"limit": 2}).json()

    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["limit"] == 2 and body["offset"] == 0


def test_validation_error_is_problem_json(client):
    r = client.post("/api/v1/devices", json={"name": "", "host": "bad host!", "port": 70000})

    assert r.status_code == 422
    assert r.headers["content-type"] == "application/problem+json"
    assert {e["field"] for e in r.json()["errors"]} == {"name", "host", "port"}


def test_unknown_device_is_404_problem(client):
    r = client.get("/api/v1/devices/00000000-0000-0000-0000-000000000000")

    assert r.status_code == 404
    assert r.json() == {"type": "about:blank", "title": "Not found", "status": 404, "detail": "Device not found"}


def test_probe_route_is_not_shadowed_by_device_id(client):
    r = client.post("/api/v1/devices/probe", json={"host": "192.168.1.102"})

    assert r.status_code == 200
    assert r.json() == {"reachable": True, "codec": "H.264", "error": None}
