from uuid import UUID

import asyncpg

from ivms.core.errors import Conflict

_COLUMNS = "id, username, name, status::text AS status, last_login_at, created_at"


class UserModel:
    """The users table. Usernames are stored lowercase."""

    def __init__(self, conn: asyncpg.Connection):
        self.conn = conn

    async def get(self, user_id: UUID) -> dict | None:
        row = await self.conn.fetchrow(f"SELECT {_COLUMNS} FROM users WHERE id = $1", user_id)
        return dict(row) if row else None

    async def get_credentials(self, username: str) -> dict | None:
        """id, status, password_hash: what is needed to check a sign-in."""
        row = await self.conn.fetchrow(
            "SELECT id, status::text AS status, password_hash FROM users WHERE username = $1", username
        )
        return dict(row) if row else None

    async def touch_last_login(self, user_id: UUID) -> None:
        await self.conn.execute("UPDATE users SET last_login_at = now() WHERE id = $1", user_id)

    async def has_users(self) -> bool:
        return await self.conn.fetchval("SELECT EXISTS (SELECT 1 FROM users)")

    async def create_first(self, username: str, name: str, password_hash: str) -> UUID | None:
        """Creates the user only if there is none yet (first-run setup). None if one exists."""
        async with self.conn.transaction():
            # Blocks a concurrent setup until this one commits, so only one first user is created
            await self.conn.execute("LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE")
            if await self.has_users():
                return None
            return await self.create(username, name, password_hash)

    async def create(self, username: str, name: str, password_hash: str) -> UUID:
        try:
            return await self.conn.fetchval(
                "INSERT INTO users (username, name, password_hash) VALUES ($1, $2, $3) RETURNING id",
                username,
                name,
                password_hash,
            )
        except asyncpg.UniqueViolationError as e:
            raise Conflict(f'Username "{username}" is taken') from e
