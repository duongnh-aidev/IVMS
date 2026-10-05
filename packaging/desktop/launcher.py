"""IVMS desktop entry point (macOS IVMS.app, Windows IVMS.exe).

Opening the app starts every service, in order: PostgreSQL (bundled, IVMS's own server and data folder),
database migrations, MediaMTX (video relay), the API, then the web UI in a native window. Closing the window
or quitting stops them in reverse order. Services left running by a crash are stopped on the next start.
Setting DATABASE_URL in ivms.env uses that PostgreSQL server instead of the bundled one.

Files:
  macOS    ~/Library/Application Support/IVMS/ivms.env      settings and generated secrets
           ~/Library/Application Support/IVMS/postgres/     database
           ~/Library/Logs/IVMS/                             ivms.log (API), postgres.log, mediamtx.log
  Windows  %APPDATA%\\IVMS\\ivms.env
           %LOCALAPPDATA%\\IVMS\\postgres\\
           %LOCALAPPDATA%\\IVMS\\Logs\\
"""

import asyncio
import atexit
import ctypes
import html
import logging
import os
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

APP_NAME = "IVMS"
WINDOWS = sys.platform == "win32"
if WINDOWS:
    SUPPORT_DIR = Path(os.environ["APPDATA"]) / APP_NAME  # settings (roaming)
    DATA_DIR = Path(os.environ["LOCALAPPDATA"]) / APP_NAME  # database (stays on this PC)
    LOG_DIR = DATA_DIR / "Logs"
else:
    SUPPORT_DIR = DATA_DIR = Path.home() / "Library" / "Application Support" / APP_NAME
    LOG_DIR = Path.home() / "Library" / "Logs" / APP_NAME
CONFIG = SUPPORT_DIR / "ivms.env"
PG_DATA = DATA_DIR / "postgres"
MEDIAMTX_PIDFILE = DATA_DIR / "mediamtx.pid"
# Fixed so the web UI keeps its origin (and its saved sign-in) between runs
DEFAULT_API_PORT = 8765
# Bundled PostgreSQL: local only, on a port that does not clash with another PostgreSQL (5432)
DEFAULT_DB_PORT = 54329
DB_USER = "ivms"
# MediaMTX listen addresses; any MTX_<SETTING> in ivms.env overrides its mediamtx.yml value
MEDIAMTX_DEFAULTS = {
    "MTX_APIADDRESS": "127.0.0.1:9997",  # control API: local only
    "MTX_RTSPADDRESS": ":8554",
    "MTX_HLSADDRESS": ":8888",
    "MTX_WEBRTCADDRESS": ":8889",
}

EXE = ".exe" if WINDOWS else ""
# Windows: the app has no console; without this every child process opens one
NO_WINDOW = subprocess.CREATE_NO_WINDOW if WINDOWS else 0

# Bundled files: inside the app (PyInstaller), the repository in development (after a build script ran)
if getattr(sys, "frozen", False):
    RESOURCES = Path(sys._MEIPASS)
    WEB_DIR, MIGRATIONS_DIR = RESOURCES / "web", RESOURCES / "migrations"
    MEDIAMTX_BIN, MEDIAMTX_CONF = RESOURCES / "bin" / f"mediamtx{EXE}", RESOURCES / "mediamtx.yml"
    PG_BIN = RESOURCES / "postgres" / "bin"
else:
    ROOT = Path(__file__).resolve().parents[2]
    BUILD = ROOT / "build" / ("windows" if WINDOWS else "macos")
    sys.path.insert(0, str(ROOT / "backend"))
    WEB_DIR, MIGRATIONS_DIR = ROOT / "frontend" / "dist", ROOT / "db" / "prisma" / "migrations"
    MEDIAMTX_BIN, MEDIAMTX_CONF = BUILD / f"mediamtx{EXE}", ROOT / "deploy" / "docker" / "mediamtx.yml"
    PG_BIN = BUILD / "postgres" / "bin"

log = logging.getLogger("ivms.launcher")


class StartupError(Exception):
    """Shown to the user in the window. `action` adds a button: (label, url)."""

    def __init__(self, message: str, action: tuple[str, str] | None = None):
        super().__init__(message)
        self.action = action


# ---- settings ----


def load_config() -> bool:
    """Reads ivms.env into the environment, creating it with fresh secrets on first run.
    Returns True when IVMS runs its bundled PostgreSQL (no DATABASE_URL set)."""
    SUPPORT_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG.exists():
        CONFIG.write_text(
            "# IVMS settings. Restart IVMS after editing.\n"
            f"API_PORT={DEFAULT_API_PORT}\n"
            "ACCESS_TOKEN_TTL_SECONDS=1800\n"
            f"# Database: IVMS starts and stops its own PostgreSQL (data in {PG_DATA}) on this local port.\n"
            f"DB_PORT={DEFAULT_DB_PORT}\n"
            "# To use another PostgreSQL server instead, uncomment and edit:\n"
            "# DATABASE_URL=postgresql://user:password@host:5432/ivms\n"
            "# Generated on first run. Keep them: SECRET_KEY encrypts stored camera passwords.\n"
            f"SECRET_KEY={secrets.token_urlsafe(48)}\n"
            f"JWT_SECRET={secrets.token_urlsafe(48)}\n"
            f"DB_PASSWORD={secrets.token_urlsafe(32)}\n"
        )
        CONFIG.chmod(0o600)
    settings = {}
    for line in CONFIG.read_text().splitlines():
        key, sep, value = line.partition("=")
        if sep and not key.lstrip().startswith("#"):
            settings[key.strip()] = value.strip()
    bundled_db = "DATABASE_URL" not in settings and "DATABASE_URL" not in os.environ
    if bundled_db and not settings.get("DB_PASSWORD"):
        # ivms.env from an older version: add the bundled server's password
        settings["DB_PASSWORD"] = secrets.token_urlsafe(32)
        with CONFIG.open("a") as f:
            f.write(f"DB_PASSWORD={settings['DB_PASSWORD']}\n")
    for key, value in settings.items():
        os.environ.setdefault(key, value)
    if bundled_db:
        os.environ.setdefault("DB_PORT", str(DEFAULT_DB_PORT))
        os.environ["DATABASE_URL"] = (
            f"postgresql://{DB_USER}:{os.environ['DB_PASSWORD']}@127.0.0.1:{os.environ['DB_PORT']}/ivms"
        )
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
    return bundled_db


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


def run_tool(*args: str | Path, timeout: float = 120) -> subprocess.CompletedProcess:
    """Runs a bundled PostgreSQL program, output appended to postgres.log."""
    with (LOG_DIR / "postgres.log").open("ab") as out:
        return subprocess.run(
            [str(a) for a in args],
            stdout=out,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            creationflags=NO_WINDOW,
            check=False,  # callers look at returncode
        )


class BundledPostgres:
    """IVMS's own PostgreSQL server: created on first run, started with the app and stopped with it."""

    def __init__(self, port: int, password: str):
        self.port, self.password = port, password
        self.proc: subprocess.Popen | None = None

    def start(self) -> None:
        if WINDOWS and ctypes.windll.shell32.IsUserAnAdmin():
            raise StartupError(
                "IVMS is running as administrator, and its database refuses to start that way. "
                "Close IVMS and open it normally (not with “Run as administrator”)."
            )
        if not (PG_DATA / "PG_VERSION").exists():
            self._create()
        self._stop_leftover()
        if not port_free(self.port):
            raise StartupError(
                f"Port {self.port} is already in use, so the database cannot start. "
                f"Set DB_PORT to another port in {CONFIG}, save, then try again.",
                ("Open settings", CONFIG.as_uri()),
            )
        with (LOG_DIR / "postgres.log").open("ab") as out:
            self.proc = subprocess.Popen(
                [
                    str(PG_BIN / f"postgres{EXE}"),
                    *("-D", str(PG_DATA), "-p", str(self.port)),
                    *("-c", "listen_addresses=127.0.0.1", "-c", "unix_socket_directories="),
                ],
                stdout=out,
                stderr=subprocess.STDOUT,
                creationflags=NO_WINDOW,
            )
        asyncio.run(self._wait_ready(60))

    def _create(self) -> None:
        """initdb into a temporary folder, so an interrupted first run leaves nothing half-made."""
        log.info("Creating the database cluster in %s", PG_DATA)
        tmp = PG_DATA.with_name("postgres.new")
        shutil.rmtree(tmp, ignore_errors=True)
        pwfile = DATA_DIR / "postgres.pw"
        pwfile.write_text(self.password)
        try:
            result = run_tool(
                PG_BIN / f"initdb{EXE}",
                *("-D", tmp, "-U", DB_USER, f"--pwfile={pwfile}"),
                *("--auth=scram-sha-256", "--encoding=UTF8", "--no-locale"),
            )
        finally:
            pwfile.unlink(missing_ok=True)
        if result.returncode != 0:
            shutil.rmtree(tmp, ignore_errors=True)
            raise StartupError(f"Could not create the database. See {LOG_DIR / 'postgres.log'}.")
        tmp.rename(PG_DATA)

    def _stop_leftover(self) -> None:
        # A server left running by a crashed IVMS still holds the data folder
        if (PG_DATA / "postmaster.pid").exists() and run_tool(
            PG_BIN / f"pg_ctl{EXE}", "status", "-D", PG_DATA
        ).returncode == 0:
            log.warning("Stopping a PostgreSQL left running by a previous IVMS")
            run_tool(PG_BIN / f"pg_ctl{EXE}", "stop", "-D", PG_DATA, "-m", "fast", "-w", "-t", "30")

    async def _wait_ready(self, timeout: float) -> None:
        import asyncpg

        deadline = time.monotonic() + timeout
        while True:
            if self.proc.poll() is not None:
                raise StartupError(f"The database stopped while starting. See {LOG_DIR / 'postgres.log'}.")
            try:
                conn = await asyncpg.connect(
                    user=DB_USER,
                    password=self.password,
                    host="127.0.0.1",
                    port=self.port,
                    database="postgres",
                    timeout=2,
                )
                await conn.close()
                return
            except (OSError, TimeoutError, asyncpg.CannotConnectNowError):
                if time.monotonic() > deadline:
                    raise StartupError(f"The database did not start. See {LOG_DIR / 'postgres.log'}.") from None
                await asyncio.sleep(0.3)

    def stop(self) -> None:
        if self.proc is None or self.proc.poll() is not None:
            return
        # Fast shutdown: ends sessions, writes a checkpoint, so the next start needs no recovery
        run_tool(PG_BIN / f"pg_ctl{EXE}", "stop", "-D", PG_DATA, "-m", "fast", "-w", "-t", "30", timeout=40)
        try:
            self.proc.wait(10)
        except subprocess.TimeoutExpired:
            self.proc.kill()


async def prepare_database(dsn: str) -> None:
    """Creates the database if it does not exist and applies migrations."""
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
            "Cannot reach the PostgreSQL server set in DATABASE_URL. Make sure it is running, or remove "
            "DATABASE_URL to use the database built into IVMS, then try again.",
            ("Open settings", CONFIG.as_uri()),
        ) from e
    except (asyncpg.InvalidPasswordError, asyncpg.InvalidAuthorizationSpecificationError) as e:
        raise StartupError(
            f"PostgreSQL rejected the login ({e}). Set the user and password in DATABASE_URL, save, then try again.",
            ("Open settings", CONFIG.as_uri()),
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
    """Starts PostgreSQL -> migrations -> MediaMTX -> API; stop() undoes it in reverse order."""

    def __init__(self, bundled_db: bool):
        self.postgres = BundledPostgres(int(os.environ["DB_PORT"]), os.environ["DB_PASSWORD"]) if bundled_db else None
        self.mediamtx: subprocess.Popen | None = None
        self.server = None  # uvicorn.Server
        self.api_thread: threading.Thread | None = None
        self.url = ""
        self._lock = threading.Lock()

    def start(self) -> None:
        from ivms.core.config import get_settings

        settings = get_settings()
        if self.postgres is not None:
            self.postgres.start()
        asyncio.run(prepare_database(settings.database_url))
        self._start_mediamtx()
        self._start_api(settings.api_port)

    def _start_mediamtx(self) -> None:
        stop_leftover_mediamtx()
        for key in MEDIAMTX_DEFAULTS:
            port = int(_port(os.environ[key]))
            if not port_free(port):
                raise StartupError(
                    f"Port {port} is already in use, so the video relay cannot start. "
                    "Quit the program using it (for example a MediaMTX started with Docker) and try again, "
                    f"or set {key}=:<other port> in {CONFIG}."
                )
        with (LOG_DIR / "mediamtx.log").open("ab") as out:
            self.mediamtx = subprocess.Popen(
                [str(MEDIAMTX_BIN), str(MEDIAMTX_CONF)],
                cwd=DATA_DIR,  # where it writes generated files (e.g. auto.key / auto.crt)
                env=os.environ,
                stdout=out,
                stderr=subprocess.STDOUT,
                creationflags=NO_WINDOW,
            )
        MEDIAMTX_PIDFILE.write_text(str(self.mediamtx.pid))
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
        self.api_thread = threading.Thread(target=self.server.run, name="api", daemon=True)
        self.api_thread.start()
        self.url = f"http://127.0.0.1:{port}/"
        if not wait_http(self.url + "api/v1/system/health", 20):
            raise StartupError(f"The IVMS server did not start. See {LOG_DIR / 'ivms.log'}.")

    def stop(self) -> None:
        """Safe to call more than once and from any thread (window closed, app exit, retry)."""
        with self._lock:
            if self.server is not None:
                self.server.should_exit = True  # closes its database pool on the way out
                if self.api_thread is not None:
                    self.api_thread.join(10)
                self.server = None
            if self.mediamtx is not None:
                if self.mediamtx.poll() is None:
                    self.mediamtx.terminate()
                    try:
                        self.mediamtx.wait(5)
                    except subprocess.TimeoutExpired:
                        self.mediamtx.kill()
                MEDIAMTX_PIDFILE.unlink(missing_ok=True)
                self.mediamtx = None
            if self.postgres is not None:
                self.postgres.stop()


def stop_leftover_mediamtx() -> None:
    """Stops a MediaMTX left running by a crashed IVMS (it would hold the video ports)."""
    import psutil

    try:
        pid = int(MEDIAMTX_PIDFILE.read_text())
        proc = psutil.Process(pid)
        if Path(proc.exe()).resolve() == MEDIAMTX_BIN.resolve():
            log.warning("Stopping a MediaMTX left running by a previous IVMS (pid %s)", pid)
            proc.terminate()
            proc.wait(5)
    except (OSError, ValueError, psutil.Error):
        pass
    MEDIAMTX_PIDFILE.unlink(missing_ok=True)


# ---- window ----

PAGE = """<!doctype html><meta charset="utf-8"><style>
body{{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
font:14px -apple-system,"Segoe UI",sans-serif;color:#171A20;background:#F4F4F4}}
.box{{max-width:440px;text-align:center;display:flex;flex-direction:column;gap:14px;padding:24px}}
h1{{font-size:20px;margin:0}} p{{margin:0;line-height:20px;color:#5C5E62}}
button{{height:34px;padding:0 16px;border:0;border-radius:6px;font:inherit;font-weight:500;cursor:pointer}}
.primary{{background:#3E6AE1;color:#fff}} .secondary{{background:#fff;color:#171A20;box-shadow:inset 0 0 0 1px #D0D1D2}}
</style><div class="box">{body}</div>"""


def starting_page() -> str:
    return PAGE.format(body="<h1>Starting IVMS…</h1><p>Starting the database and the video relay.</p>")


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
        if url.startswith("file:") and WINDOWS:
            os.startfile(CONFIG)  # Notepad (or the .env editor) rather than the browser
        elif url.startswith("file:"):
            subprocess.Popen(["open", "-t", str(CONFIG)])  # default text editor
        else:
            webbrowser.open(url)

    def retry(self) -> None:
        threading.Thread(target=self._app.boot, daemon=True).start()


class Launcher:
    def __init__(self, bundled_db: bool):
        self.bundled_db = bundled_db
        self.services = Services(bundled_db)
        self.window = None

    def boot(self) -> None:
        self.services.stop()
        self.services = Services(self.bundled_db)
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

    def quit(self, sig: signal.Signals) -> None:
        log.info("%s received, quitting", sig.name)
        self.services.stop()
        if self.window is not None:
            self.window.destroy()  # webview.start() returns, then main() exits


def watch_signals(on_signal) -> None:
    """Calls on_signal on SIGTERM / SIGINT / SIGHUP (logout, shutdown, kill, Ctrl+C).

    The window's event loop owns the main thread, so Python-level handlers would only run after it returns.
    Python's C-level handler still writes the signal number to the wakeup fd right away: a thread waits on it.
    (Blocking the signals instead would be inherited by PostgreSQL and MediaMTX, which then could not be stopped.)
    """
    reader, writer = socket.socketpair()
    writer.setblocking(False)
    signal.set_wakeup_fd(writer.fileno())
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        signal.signal(sig, lambda *_: None)

    def wait() -> None:
        data = reader.recv(1)
        on_signal(signal.Signals(data[0]))
        writer.close()

    threading.Thread(target=wait, name="signals", daemon=True).start()


def main() -> None:
    bundled_db = load_config()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    setup_logging()
    log.info("IVMS starting (resources: %s, bundled database: %s)", WEB_DIR.parent, bundled_db)
    launcher = Launcher(bundled_db)
    # Quit cleanly when asked by the system instead of the window (Windows closes the window itself)
    if not WINDOWS:
        watch_signals(launcher.quit)
    atexit.register(lambda: launcher.services.stop())
    try:
        launcher.run()
    finally:
        launcher.services.stop()
    log.info("IVMS stopped")


if __name__ == "__main__":
    main()
