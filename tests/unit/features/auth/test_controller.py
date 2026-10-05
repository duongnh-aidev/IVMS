import pytest

from ivms.core.errors import Conflict, Unauthorized
from ivms.core.security import TokenCodec
from ivms.features.auth.controller import AuthController
from ivms.features.auth.view import LoginRequest, SetupRequest

from .fakes import FakeUserModel


@pytest.fixture
async def auth():
    model = FakeUserModel()
    controller = AuthController(model, TokenCodec("test-jwt-secret-at-least-32-bytes!", ttl_seconds=1800))
    user = await controller.create_user(" Admin ", "Administrator", "correct-horse")
    return controller, model, user


async def test_login_returns_token_for_the_user(auth):
    controller, _, user = auth

    # Username is case-insensitive
    result = await controller.login(LoginRequest(username="ADMIN", password="correct-horse"))

    assert result.user.id == user.id
    assert result.user.last_login_at is not None
    assert result.expires_in == 1800
    assert controller.tokens.verify(result.access_token) == user.id


@pytest.mark.parametrize(("username", "password"), [("admin", "wrong"), ("nobody", "correct-horse")])
async def test_login_rejects_bad_credentials_with_one_message(auth, username, password):
    controller, *_ = auth

    with pytest.raises(Unauthorized, match="Wrong username or password"):
        await controller.login(LoginRequest(username=username, password=password))


async def test_login_rejects_inactive_user(auth):
    controller, model, user = auth
    model.rows[user.id]["status"] = "locked"

    with pytest.raises(Unauthorized, match="not active"):
        await controller.login(LoginRequest(username="admin", password="correct-horse"))


async def test_me_of_deleted_user_is_unauthorized(auth):
    controller, model, user = auth
    model.rows.clear()

    with pytest.raises(Unauthorized):
        await controller.me(user.id)


async def test_usernames_are_unique_regardless_of_case(auth):
    controller, *_ = auth

    with pytest.raises(Conflict):
        await controller.create_user("ADMIN", "Other", "another-pass")


async def test_first_run_setup_creates_and_signs_in_the_first_user():
    controller = AuthController(FakeUserModel(), TokenCodec("test-jwt-secret-at-least-32-bytes!", ttl_seconds=1800))
    assert (await controller.setup_status()).required

    result = await controller.setup(SetupRequest(username="Owner", password="long-enough"))

    assert result.user.username == "owner" and result.user.name == "owner"
    assert controller.tokens.verify(result.access_token) == result.user.id
    assert not (await controller.setup_status()).required


async def test_setup_is_closed_once_a_user_exists(auth):
    controller, *_ = auth

    with pytest.raises(Conflict, match="already done"):
        await controller.setup(SetupRequest(username="intruder", password="long-enough"))
