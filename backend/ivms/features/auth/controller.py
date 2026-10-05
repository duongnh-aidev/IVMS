from typing import Annotated, Protocol
from uuid import UUID

from fastapi import APIRouter, Depends

from ivms.core.db import Conn
from ivms.core.deps import CurrentUserId, get_token_codec
from ivms.core.errors import Conflict, Unauthorized
from ivms.core.security import DUMMY_HASH, TokenCodec, hash_password, verify_password

from .model import UserModel
from .view import LoginRequest, SetupRequest, SetupStatus, TokenResponse, User

# Same message for unknown user and wrong password: do not reveal which usernames exist
BAD_CREDENTIALS = "Wrong username or password"


class Model(Protocol):
    async def get(self, user_id: UUID) -> dict | None: ...
    async def get_credentials(self, username: str) -> dict | None: ...
    async def touch_last_login(self, user_id: UUID) -> None: ...
    async def create(self, username: str, name: str, password_hash: str) -> UUID: ...
    async def has_users(self) -> bool: ...
    async def create_first(self, username: str, name: str, password_hash: str) -> UUID | None: ...


class AuthController:
    def __init__(self, model: Model, tokens: TokenCodec):
        self.model = model
        self.tokens = tokens

    async def login(self, data: LoginRequest) -> TokenResponse:
        creds = await self.model.get_credentials(data.username)
        # Hash even when the user does not exist, so response time does not leak it
        valid = verify_password(creds["password_hash"] if creds else DUMMY_HASH, data.password)
        if not creds or not valid:
            raise Unauthorized(BAD_CREDENTIALS)
        if creds["status"] != "active":
            raise Unauthorized("This account is not active")
        return await self._sign_in(creds["id"])

    async def setup_status(self) -> SetupStatus:
        return SetupStatus(required=not await self.model.has_users())

    async def setup(self, data: SetupRequest) -> TokenResponse:
        """First run: creates the first user and signs them in. 409 once any user exists."""
        user_id = await self.model.create_first(data.username, data.name or data.username, hash_password(data.password))
        if user_id is None:
            raise Conflict("Setup is already done, sign in instead")
        return await self._sign_in(user_id)

    async def _sign_in(self, user_id: UUID) -> TokenResponse:
        await self.model.touch_last_login(user_id)
        return TokenResponse(
            access_token=self.tokens.issue(user_id),
            expires_in=self.tokens.ttl_seconds,
            user=await self.me(user_id),
        )

    async def me(self, user_id: UUID) -> User:
        row = await self.model.get(user_id)
        if row is None:
            # Token is valid but the user was deleted since
            raise Unauthorized("User no longer exists")
        return User(**row)

    async def create_user(self, username: str, name: str, password: str) -> User:
        user_id = await self.model.create(username.strip().lower(), name, hash_password(password))
        return await self.me(user_id)


# ---- HTTP routes ----

router = APIRouter(prefix="/auth", tags=["auth"])


def get_controller(conn: Conn, tokens: Annotated[TokenCodec, Depends(get_token_codec)]) -> AuthController:
    return AuthController(UserModel(conn), tokens)


Controller = Annotated[AuthController, Depends(get_controller)]


@router.post("/login")
async def login(data: LoginRequest, controller: Controller) -> TokenResponse:
    """Public. Returns an access token valid for `expiresIn` seconds."""
    return await controller.login(data)


@router.get("/setup")
async def setup_status(controller: Controller) -> SetupStatus:
    """Public. Whether the first user still has to be created."""
    return await controller.setup_status()


@router.post("/setup")
async def setup(data: SetupRequest, controller: Controller) -> TokenResponse:
    """Public until the first user exists: creates it and returns a token like /login."""
    return await controller.setup(data)


@router.get("/me")
async def me(user_id: CurrentUserId, controller: Controller) -> User:
    return await controller.me(user_id)
