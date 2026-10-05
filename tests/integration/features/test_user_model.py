"""SQL of the users model against a real database."""

from uuid import uuid4

import pytest

from ivms.core.errors import Conflict
from ivms.features.auth.model import UserModel


@pytest.fixture
def users(conn):
    return UserModel(conn)


@pytest.fixture
def name():
    # The dev database may already have real users (e.g. "admin")
    return f"test-{uuid4().hex[:8]}"


async def test_create_get_and_credentials(users, name):
    user_id = await users.create(name, "Administrator", "hash")

    user = await users.get(user_id)
    assert user["username"] == name and user["status"] == "active" and user["last_login_at"] is None
    assert "password_hash" not in user
    assert await users.get_credentials(name) == {"id": user_id, "status": "active", "password_hash": "hash"}
    assert await users.get_credentials("nobody") is None

    await users.touch_last_login(user_id)
    assert (await users.get(user_id))["last_login_at"] is not None


async def test_username_is_unique(users, name):
    await users.create(name, "Administrator", "hash")

    with pytest.raises(Conflict):
        await users.create(name, "Other", "hash")
