"""Password hashing and JWT access tokens."""

import time
from collections.abc import Callable
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from ivms.core.errors import Unauthorized

_hasher = PasswordHasher()  # Argon2id with the library's recommended parameters
ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(hashed: str, plain: str) -> bool:
    try:
        return _hasher.verify(hashed, plain)
    except (VerifyMismatchError, InvalidHashError):
        return False


# Compared against when the username does not exist, so both cases take the same time
DUMMY_HASH = hash_password("not-a-real-password")


class TokenCodec:
    """Issues and checks access tokens: `sub` = user id, expiring `ttl_seconds` after issue."""

    def __init__(self, secret: str, ttl_seconds: int, clock: Callable[[], float] = time.time):
        self._secret = secret
        self.ttl_seconds = ttl_seconds
        self._clock = clock

    def issue(self, user_id: UUID) -> str:
        now = int(self._clock())
        claims = {"sub": str(user_id), "iat": now, "exp": now + self.ttl_seconds}
        return jwt.encode(claims, self._secret, algorithm=ALGORITHM)

    def verify(self, token: str) -> UUID:
        """Returns the user id, or raises Unauthorized if the token is invalid or expired."""
        try:
            # Expiry is checked below against our clock (injectable in tests)
            claims = jwt.decode(
                token,
                self._secret,
                algorithms=[ALGORITHM],
                options={"require": ["sub", "iat", "exp"], "verify_exp": False},
            )
            user_id = UUID(claims["sub"])
        except (jwt.InvalidTokenError, ValueError) as e:
            raise Unauthorized("Invalid access token") from e
        if claims["exp"] <= self._clock():
            raise Unauthorized("Session expired, please sign in again")
        return user_id
