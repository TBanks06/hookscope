"""Pydantic v2 request/response models (API contract)."""
import datetime as dt
import uuid
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

from .models import DeliveryStatus, EventStatus


# --- auth ----------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    created_at: dt.datetime


# --- projects -------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    ingest_key: str          # the frontend builds the full URL from this
    created_at: dt.datetime


class ProjectRotated(BaseModel):
    ingest_key: str


# --- events -----------------------------------------------------------------
class EventOut(BaseModel):
    """Lightweight list shape — headers/body excluded for speed."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    project_id: uuid.UUID
    received_at: dt.datetime
    method: str
    path: str
    content_type: str
    size: int
    status: EventStatus
    source_ip: str | None
    is_valid_json: bool | None
    truncated: bool


class EventDetail(EventOut):
    headers: dict[str, str]
    query: dict[str, str]
    body: str


class EventPage(BaseModel):
    items: list[EventOut]
    next_cursor: str | None = None


# --- replay / delivery --------------------------------------------------------
class ReplayIn(BaseModel):
    target_url: HttpUrl
    method: Literal["POST", "PUT", "PATCH"] = "POST"
    headers: dict[str, str] | None = None      # None → derive from original event
    payload: str | None = None                 # None → reuse the original body
    max_attempts: int = Field(default=5, ge=1, le=10)


class DeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    event_id: uuid.UUID
    target_url: str
    method: str
    status: DeliveryStatus
    attempts: int
    max_attempts: int
    last_status_code: int | None
    last_error: str | None
    latency_ms: int | None
    attempt_log: list[dict[str, Any]]
    created_at: dt.datetime
    updated_at: dt.datetime
