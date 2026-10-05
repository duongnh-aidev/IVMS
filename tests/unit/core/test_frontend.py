"""The built frontend is served next to the API in packaged builds."""

import pytest
from fastapi.testclient import TestClient

from ivms.app import create_app
from ivms.core.config import Settings


@pytest.fixture
def client(tmp_path):
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text("<!doctype html><title>IVMS</title>")
    (tmp_path / "assets" / "app.js").write_text("console.log('ivms')")
    return TestClient(create_app(Settings(frontend_dist=tmp_path)))


def test_serves_index_and_assets(client):
    assert "<title>IVMS</title>" in client.get("/").text
    assert client.get("/assets/app.js").text == "console.log('ivms')"


def test_unknown_page_loads_the_app(client):
    assert "<title>IVMS</title>" in client.get("/devices/some-page").text


def test_unknown_api_route_stays_a_json_404(client):
    r = client.get("/api/v1/nope")

    assert r.status_code == 404
    assert r.headers["content-type"] == "application/problem+json"


def test_api_routes_still_win(client):
    assert client.get("/api/v1/devices").status_code == 401


def test_no_frontend_folder_means_api_only(tmp_path):
    client = TestClient(create_app(Settings(frontend_dist=tmp_path / "missing")))

    assert client.get("/").status_code == 404
