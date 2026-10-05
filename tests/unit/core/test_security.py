from uuid import uuid4

import pytest

from ivms.core.errors import Unauthorized
from ivms.core.security import TokenCodec, hash_password, verify_password

TEST_SECRET = "test-jwt-secret-at-least-32-bytes!"


class FakeClock:
    def __init__(self, now: float = 1_000_000.0):
        self.now = now

    def __call__(self) -> float:
        return self.now


def test_password_hash_round_trip():
    hashed = hash_password("s3cret-pass")

    assert hashed != "s3cret-pass"
    assert verify_password(hashed, "s3cret-pass")
    assert not verify_password(hashed, "wrong")
    assert not verify_password("not-a-hash", "s3cret-pass")


def test_token_round_trip():
    codec = TokenCodec(TEST_SECRET, ttl_seconds=1800)
    user_id = uuid4()

    assert codec.verify(codec.issue(user_id)) == user_id


def test_token_expires_after_ttl():
    clock = FakeClock()
    codec = TokenCodec(TEST_SECRET, ttl_seconds=5, clock=clock)
    token = codec.issue(uuid4())

    clock.now += 4.9
    codec.verify(token)
    clock.now += 0.1

    with pytest.raises(Unauthorized, match="sign in again"):
        codec.verify(token)


@pytest.mark.parametrize(
    "token", ["", "not-a-jwt", TokenCodec("other-secret-also-at-least-32-bytes", 1800).issue(uuid4())]
)
def test_invalid_tokens_are_rejected(token):
    with pytest.raises(Unauthorized, match="Invalid access token"):
        TokenCodec(TEST_SECRET, ttl_seconds=1800).verify(token)
