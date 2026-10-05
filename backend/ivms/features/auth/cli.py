"""`uv run poe create-user <username> [--name NAME]`: create a user who can sign in (prompts for the password)."""

import argparse
import asyncio
import getpass
import sys

import asyncpg

from ivms.core.config import get_settings
from ivms.core.errors import AppError
from ivms.core.security import TokenCodec

from .controller import AuthController
from .model import UserModel

MIN_PASSWORD = 8


async def _create(username: str, name: str, password: str) -> None:
    settings = get_settings()
    conn = await asyncpg.connect(settings.database_url)
    try:
        tokens = TokenCodec(settings.jwt_secret, settings.access_token_ttl_seconds)
        user = await AuthController(UserModel(conn), tokens).create_user(username, name, password)
    finally:
        await conn.close()
    print(f"Created user {user.username} ({user.id})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an IVMS user")
    parser.add_argument("username")
    parser.add_argument("--name", help="display name (default: the username)")
    args = parser.parse_args()

    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD:
        sys.exit(f"Password must be at least {MIN_PASSWORD} characters")
    if getpass.getpass("Repeat password: ") != password:
        sys.exit("Passwords do not match")
    try:
        asyncio.run(_create(args.username, args.name or args.username, password))
    except AppError as e:
        sys.exit(str(e))


if __name__ == "__main__":
    main()
