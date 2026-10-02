"""Reversible encryption for secrets the backend must read back (e.g. camera passwords)."""

import base64
import hashlib

from cryptography.fernet import Fernet


class SecretBox:
    def __init__(self, secret_key: str):
        # Fernet wants 32 url-safe base64 bytes; derive them so SECRET_KEY can be any string
        key = base64.urlsafe_b64encode(hashlib.sha256(secret_key.encode()).digest())
        self._fernet = Fernet(key)

    def encrypt(self, plain: str) -> str:
        return self._fernet.encrypt(plain.encode()).decode()

    def decrypt(self, token: str) -> str:
        return self._fernet.decrypt(token.encode()).decode()
