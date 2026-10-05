from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from pydantic import Field, StringConstraints

from ivms.core.schemas import ApiModel

# Lowercased so sign-in is case-insensitive
Username = Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=1, max_length=50)]
UserStatus = Literal["active", "locked", "invited"]


class LoginRequest(ApiModel):
    username: Username
    password: str = Field(min_length=1, max_length=200)


class SetupStatus(ApiModel):
    # True until the first user exists: the client then shows "create the admin account"
    required: bool


class SetupRequest(ApiModel):
    username: Username
    name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] = ""
    password: str = Field(min_length=8, max_length=200)


class User(ApiModel):
    id: UUID
    username: str
    name: str
    status: UserStatus
    last_login_at: datetime | None
    created_at: datetime


class TokenResponse(ApiModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    # Seconds until the token expires; the client must sign in again after that
    expires_in: int
    user: User
