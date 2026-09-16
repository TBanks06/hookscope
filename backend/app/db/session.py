"""Async engine + session factory. `get_db` is the FastAPI dependency."""
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

engine = create_async_engine(
    get_settings().database_url,
    pool_size=20,          # tune to CPU count; each worker process gets its own pool
    max_overflow=10,
    pool_pre_ping=True,    # survive dropped TCP connections
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
