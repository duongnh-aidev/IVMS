"""Cross-platform helpers for poe tasks that need more than a single command."""

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _run(*args: str) -> None:
    # Resolve through PATH so Windows shims like npm.cmd are found
    exe = shutil.which(args[0]) or args[0]
    subprocess.run([exe, *args[1:]], cwd=ROOT, check=True)


def setup() -> None:
    """Prepare a fresh clone for development."""
    _run("uv", "sync", "--all-groups")

    for project in ("frontend", "db"):
        if (ROOT / project / "package.json").exists():
            _run("npm", "--prefix", project, "install")
        else:
            print(f"{project}/package.json not found, skipping npm install")

    _run("uv", "run", "pre-commit", "install")

    env, example = ROOT / ".env", ROOT / ".env.example"
    if not env.exists():
        shutil.copyfile(example, env)
        print("Created .env from .env.example")


def infra_up() -> None:
    """Start supporting services, if any are defined in docker-compose.yml."""
    services = subprocess.run(
        [shutil.which("docker") or "docker", "compose", "config", "--services"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.split()
    if not services:
        print("No services defined in docker-compose.yml, nothing to start")
        return

    _run("docker", "compose", "up", "--detach", "--wait")
