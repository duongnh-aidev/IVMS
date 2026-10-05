"""In-memory stand-in for the users table."""

from datetime import UTC, datetime
from uuid import UUID, uuid4

from ivms.core.errors import Conflict


class FakeUserModel:
    def __init__(self):
        self.rows: dict[UUID, dict] = {}

    async def get(self, user_id):
        r = self.rows.get(user_id)
        return {k: v for k, v in r.items() if k != "password_hash"} if r else None

    async def get_credentials(self, username):
        for r in self.rows.values():
            if r["username"] == username:
                return {k: r[k] for k in ("id", "status", "password_hash")}
        return None

    async def touch_last_login(self, user_id):
        self.rows[user_id]["last_login_at"] = datetime.now(UTC)

    async def has_users(self):
        return bool(self.rows)

    async def create_first(self, username, name, password_hash):
        return None if self.rows else await self.create(username, name, password_hash)

    async def create(self, username, name, password_hash):
        if any(r["username"] == username for r in self.rows.values()):
            raise Conflict(f'Username "{username}" is taken')
        user_id = uuid4()
        self.rows[user_id] = {
            "id": user_id,
            "username": username,
            "name": name,
            "password_hash": password_hash,
            "status": "active",
            "last_login_at": None,
            "created_at": datetime.now(UTC),
        }
        return user_id
