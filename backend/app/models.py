"""ORM models. Multi-tenant: User → Project → WebhookEvent → Delivery.

The Project.ingest_key is an unguessable URL-safe token — the URL itself
is the credential (same model as webhook.site).
"""
import datetime as dt
import enum
import secrets
import uuid

from sqlalchemy import BigInteger, DateTime, Enum as SAEnum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db.base import Base


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def new_ingest_key() -> str:
    # 24 bytes of entropy ≈ unguessable; rotate-able per project.
    return secrets.token_urlsafe(24)


class EventStatus(str, enum.Enum):
    received = "received"   # accepted and stored
    invalid = "invalid"     # failed detection heuristics (bad JSON claim, truncated…)


class DeliveryStatus(str, enum.Enum):
    queued = "queued"
    sending = "sending"
    delivered = "delivered"
    failed = "failed"       # all retry attempts exhausted


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(64))
    ingest_key: Mapped[str] = mapped_column(String(64), unique=True, index=True, default=new_ingest_key)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="projects")


class WebhookEvent(Base):
    """One inbound webhook. Headers/query/body stored as-is for inspection & replay."""

    __tablename__ = "events"
    __table_args__ = (
        # Hot query: latest events for a project, newest first.
        Index("ix_events_project_time", "project_id", "received_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )

    received_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    method: Mapped[str] = mapped_column(String(10))
    path: Mapped[str] = mapped_column(String(2048))
    source_ip: Mapped[str | None] = mapped_column(String(64))

    headers: Mapped[dict] = mapped_column(JSONB, default=dict)
    query: Mapped[dict] = mapped_column(JSONB, default=dict)
    body: Mapped[str] = mapped_column(Text, default="")   # utf-8 (errors replaced)
    content_type: Mapped[str] = mapped_column(String(255), default="")
    size: Mapped[int] = mapped_column(BigInteger, default=0)
    sha256: Mapped[str] = mapped_column(String(64), default="")

    # Failure-detection signals computed at ingest time:
    is_valid_json: Mapped[bool | None] = mapped_column(default=None)   # None = not applicable
    truncated: Mapped[bool] = mapped_column(default=False)
    status: Mapped[EventStatus] = mapped_column(
        SAEnum(EventStatus, name="event_status", native_enum=False), default=EventStatus.received
    )

    deliveries: Mapped[list["Delivery"]] = relationship(back_populates="event", cascade="all, delete-orphan")


class Delivery(Base):
    """One replay job for an event. attempt_log is an append-only audit trail."""

    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )

    target_url: Mapped[str] = mapped_column(String(2048))
    method: Mapped[str] = mapped_column(String(10), default="POST")
    headers: Mapped[dict] = mapped_column(JSONB, default=dict)
    payload: Mapped[str] = mapped_column(Text, default="")

    status: Mapped[DeliveryStatus] = mapped_column(
        SAEnum(DeliveryStatus, name="delivery_status", native_enum=False), default=DeliveryStatus.queued
    )
    attempts: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=5)

    last_status_code: Mapped[int | None] = mapped_column(default=None)
    last_error: Mapped[str | None] = mapped_column(Text, default=None)
    latency_ms: Mapped[int | None] = mapped_column(default=None)

    # [{n, at, status_code?, latency_ms?, response?, error?}, …]
    attempt_log: Mapped[list] = mapped_column(JSONB, default=list)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    event: Mapped[WebhookEvent] = relationship(back_populates="deliveries")
