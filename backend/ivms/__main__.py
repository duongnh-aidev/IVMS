"""`python -m ivms [serve]`: run the API server. `python -m ivms migrate`: apply database migrations."""

import argparse
import asyncio
import sys

import uvicorn

from ivms.core.config import get_settings


def serve() -> None:
    settings = get_settings()
    uvicorn.run(
        "ivms.app:create_app",
        factory=True,
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
        reload_dirs=["backend"],
    )


def migrate() -> None:
    from ivms.core.migrate import MigrationError
    from ivms.core.migrate import migrate as run

    settings = get_settings()
    try:
        applied = asyncio.run(run(settings.database_url, settings.migrations_dir))
    except MigrationError as e:
        sys.exit(f"Migration failed: {e}")
    print(f"Applied {len(applied)} migration(s): {', '.join(applied)}" if applied else "Database is up to date")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m ivms")
    parser.add_argument("command", nargs="?", default="serve", choices=["serve", "migrate"])
    {"serve": serve, "migrate": migrate}[parser.parse_args().command]()


if __name__ == "__main__":
    main()
