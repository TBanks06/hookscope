"""Password hashing + JWT helpers (no FastAPI deps here → no circular imports)."""
import datetime as dt

import jwt
from pwdlib import PasswordHash

from .config import get_settings

ALGORITHM = "HS256"
_hasher = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return _hasher.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _hasher.verify(plain, hashed)
    except Exception:  # malformed hash → treat as auth failure
        return False


def create_access_token(user_id: str) -> str:
    s = get_settings()
    now = dt.datetime.now(dt.UTC)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + dt.timedelta(minutes=s.access_token_expire_minutes),
    }
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    """Return the user id (sub) or None if the token is invalid/expired."""
    try:
        return jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])["sub"]
    except jwt.PyJWTError:
        return None
