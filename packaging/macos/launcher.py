"""IVMS.app entry point: starts MediaMTX and the API, then shows the web UI in a native window.

PostgreSQL is not bundled: the user installs Postgres.app (https://postgresapp.com). On start the
launcher checks it, creates the `ivms` database if needed and applies migrations. Closing the window
stops everything.

Files:
  ~/Library/Application Support/IVMS/ivms.env   settings and generated secrets (edit DATABASE_URL here)
  ~/Library/Logs/IVMS/                          ivms.log (API), mediamtx.log
"""

import asyncio
import html
import logging
import os
import secrets
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

APP_NAME = "IVMS"
SUPPORT_DIR = Path.home() / "Library" / "Application Support" / APP_NAME
LOG_DIR = Path.home() / "Library" / "Logs" / APP_NAME
CONFIG = SUPPORT_DIR / "ivms.env"
POSTGRES_DOWNLOAD = "https://postgresapp.com/downloads.html"
# Fixed so the web UI keeps its origin (and its saved sign-in) between runs
DEFAULT_API_PORT = 8765
# MediaMTX listen addresses; any MTX_<SETTING> in ivms.env overrides its mediamtx.yml value
MEDIAMTX_DEFAULTS = {
    "MTX_APIADDRESS": "127.0.0.1:9997",  # control API: local only
    "MTX_RTSPADDRESS": ":8554",
    "MTX_HLSADDRESS": ":8888",
    "MTX_WEBRTCADDRESS": ":8889",
}

# Bundled files: next to this script in the .app (PyInstaller), the repository in development
if getattr(sys, "frozen", False):
    RESOURCES = Path(sys._MEIPASS)
    WEB_DIR, MIGRATIONS_DIR = RESOURCES / "web", RESOURCES / "migrations"
    MEDIAMTX_BIN, MEDIAMTX_CONF = RESOURCES / "bin" / "mediamtx", RESOURCES / "mediamtx.yml"
else:
    ROOT = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(ROOT / "backend"))
    WEB_DIR, MIGRATIONS_DIR = ROOT / "frontend" / "dist", ROOT / "db" / "prisma" / "migrations"
    MEDIAMTX_BIN, MEDIAMTX_CONF = ROOT / "build" / "macos" / "mediamtx", ROOT / "deploy" / "docker" / "mediamtx.yml"

log = logging.getLogger("ivms.launcher")


class StartupError(Exception):
    """Shown to the user in the window. `action` adds a button: (label, url)."""

    def __init__(self, message: str, action: tuple[str, str] | None = None):
        super().__init__(message)
        self.action = action


# ---- settings ----


def load_config() -> None:
    """Reads ivms.env into the environment, creating it with fresh secrets on first run."""
    SUPPORT_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG.exists():
        user = os.environ.get("USER", "postgres")
        CONFIG.write_text(
            "# IVMS settings. Restart IVMS after editing.\n"
            "# Postgres.app default: your macOS user, no password, port 5432.\n"
            f"DATABASE_URL=postgresql://{user}@localhost:5432/ivms\n"
            f"API_PORT={DEFAULT_API_PORT}\n"
            "ACCESS_TOKEN_TTL_SECONDS=1800\n"
            "# Generated on first run. Keep them: SECRET_KEY encrypts stored camera passwords.\n"
            f"SECRET_KEY={secrets.token_urlsafe(48)}\n"
            f"JWT_SECRET={secrets.token_urlsafe(48)}\n"
        )
        CONFIG.chmod(0o600)
    for line in CONFIG.read_text().splitlines():
        key, sep, value = line.partition("=")
        if sep and not key.lstrip().startswith("#"):
            os.environ.setdefault(key.strip(), value.strip())
    os.environ.update(
        API_HOST="127.0.0.1",
        API_RELOAD="false",
        FRONTEND_DIST=str(WEB_DIR),
        MIGRATIONS_DIR=str(MIGRATIONS_DIR),
    )
    for key, value in MEDIAMTX_DEFAULTS.items():
        os.environ.setdefault(key, value)
    os.environ["MEDIAMTX_API_URL"] = "http://" + os.environ["MTX_APIADDRESS"]
    os.environ["MEDIAMTX_RTSP_URL"] = "rtsp://127.0.0.1:" + _port(os.environ["MTX_RTSPADDRESS"])


def _port(address: str) -> str:
    return address.rpartition(":")[2]


def setup_logging() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=LOG_DIR / "ivms.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


# ---- services ----


def port_free(port: int) -> bool:
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


def wait_http(url: str, timeout: float, proc: subprocess.Popen | None = None) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if proc is not None and proc.poll() is not None:
            return False
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status == 200:
                    return True
        except OSError:
            pass
        time.sleep(0.3)
    return False


async def prepare_database(dsn: str) -> None:
    """Checks PostgreSQL, creates the database if it does not exist, applies migrations."""
    import asyncpg

    from ivms.core.migrate import MigrationError, migrate

    try:
        conn = await asyncpg.connect(dsn, timeout=5)
    except asyncpg.InvalidCatalogNameError:
        base, _, name = dsn.rpartition("/")
        admin = await asyncpg.connect(base + "/postgres", timeout=5)
        try:
            await admin.execute(f'CREATE DATABASE "{name}"')
        finally:
            await admin.close()
        log.info("Created database %s", name)
    except (TimeoutError, OSError) as e:
        raise StartupError(
            "PostgreSQL is not running. Install Postgres.app, open it and press “Start”, then try again.",
            ("Download Postgres.app", POSTGRES_DOWNLOAD),
        ) from e
    except asyncpg.PostgresError as e:
        raise StartupError(f"Cannot use the database: {e}. Check DATABASE_URL in {CONFIG}.") from e
    else:
        await conn.close()
    try:
        applied = await migrate(dsn, MIGRATIONS_DIR)
    except MigrationError as e:
        raise StartupError(f"Database upgrade failed: {e}") from e
    log.info("Migrations applied: %s", applied or "none")


class Services:
    def __init__(self):
        self.mediamtx: subprocess.Popen | None = None
        self.server = None  # uvicorn.Server
        self.url = ""

    def start(self) -> None:
        from ivms.core.config import get_settings

        settings = get_settings()
        asyncio.run(prepare_database(settings.database_url))
        self._start_mediamtx()
        self._start_api(settings.api_port)

    def _start_mediamtx(self) -> None:
        for key in MEDIAMTX_DEFAULTS:
            port = int(_port(os.environ[key]))
            if not port_free(port):
                raise StartupError(
                    f"Port {port} is already in use, so the video relay cannot start. "
                    "Quit the program using it (for example a MediaMTX started with Docker) and try again, "
                    f"or set {key}=:<other port> in {CONFIG}."
                )
        out = (LOG_DIR / "mediamtx.log").open("ab")
        self.mediamtx = subprocess.Popen(
            [str(MEDIAMTX_BIN), str(MEDIAMTX_CONF)], env=os.environ, stdout=out, stderr=subprocess.STDOUT
        )
        if not wait_http(os.environ["MEDIAMTX_API_URL"] + "/v3/paths/list", 15, self.mediamtx):
            raise StartupError(f"The video relay (MediaMTX) did not start. See {LOG_DIR / 'mediamtx.log'}.")

    def _start_api(self, port: int) -> None:
        import uvicorn

        from ivms.app import create_app

        if not port_free(port):
            raise StartupError(
                f"Port {port} is already in use. Is IVMS already open? Otherwise set API_PORT in {CONFIG}."
            )
        config = uvicorn.Config(create_app(), host="127.0.0.1", port=port, log_config=None, access_log=False)
        self.server = uvicorn.Server(config)
        threading.Thread(target=self.server.run, name="api", daemon=True).start()
        self.url = f"http://127.0.0.1:{port}/"
        if not wait_http(self.url + "api/v1/system/health", 20):
            raise StartupError(f"The IVMS server did not start. See {LOG_DIR / 'ivms.log'}.")

    def stop(self) -> None:
        if self.server is not None:
            self.server.should_exit = True
        if self.mediamtx is not None and self.mediamtx.poll() is None:
            self.mediamtx.terminate()
            try:
                self.mediamtx.wait(5)
            except subprocess.TimeoutExpired:
                self.mediamtx.kill()


# ---- window ----

PAGE = """<!doctype html><meta charset="utf-8"><style>
body{{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
font:14px -apple-system,sans-serif;color:#171A20;background:#F4F4F4}}
.box{{max-width:440px;text-align:center;display:flex;flex-direction:column;gap:14px;padding:24px}}
h1{{font-size:20px;margin:0}} p{{margin:0;line-height:20px;color:#5C5E62}}
button{{height:34px;padding:0 16px;border:0;border-radius:6px;font:inherit;font-weight:500;cursor:pointer}}
.primary{{background:#3E6AE1;color:#fff}} .secondary{{background:#fff;color:#171A20;box-shadow:inset 0 0 0 1px #D0D1D2}}
</style><div class="box">{body}</div>"""


def starting_page() -> str:
    return PAGE.format(body="<h1>Starting IVMS…</h1><p>Checking the database and starting the video relay.</p>")


def error_page(err: StartupError) -> str:
    action = (
        f'<button class="primary" onclick="pywebview.api.open_url({html.escape(repr(err.action[1]))})">'
        f"{html.escape(err.action[0])}</button>"
        if err.action
        else ""
    )
    return PAGE.format(
        body=f"<h1>IVMS could not start</h1><p>{html.escape(str(err))}</p>"
        f'<div style="display:flex;gap:8px;justify-content:center">{action}'
        '<button class="secondary" onclick="pywebview.api.retry()">Try again</button></div>'
    )


class Bridge:
    """Called from the start / error page (window.pywebview.api)."""

    def __init__(self, app: "Launcher"):
        self._app = app

    def open_url(self, url: str) -> None:
        webbrowser.open(url)

    def retry(self) -> None:
        threading.Thread(target=self._app.boot, daemon=True).start()


class Launcher:
    def __init__(self):
        self.services = Services()
        self.window = None

    def boot(self) -> None:
        self.services.stop()
        self.services = Services()
        self.window.load_html(starting_page())
        try:
            self.services.start()
        except StartupError as e:
            log.warning("Startup failed: %s", e)
            self.services.stop()
            self.window.load_html(error_page(e))
            return
        except Exception:
            log.exception("Startup crashed")
            self.services.stop()
            self.window.load_html(error_page(StartupError(f"Unexpected error. See {LOG_DIR / 'ivms.log'}.")))
            return
        self.window.load_url(self.services.url)

    def run(self) -> None:
        import webview

        self.window = webview.create_window(
            APP_NAME, html=starting_page(), js_api=Bridge(self), width=1440, height=900, min_size=(1024, 680)
        )
        self.window.events.closed += self.services_stop
        # Persistent storage keeps "Remember me" between launches
        webview.start(self.boot, private_mode=False, storage_path=str(SUPPORT_DIR / "webview"))

    def services_stop(self) -> None:
        self.services.stop()


def main() -> None:
    load_config()
    setup_logging()
    log.info("IVMS starting (resources: %s)", WEB_DIR.parent)
    launcher = Launcher()
    try:
        launcher.run()
    finally:
        launcher.services.stop()


if __name__ == "__main__":
    main()
