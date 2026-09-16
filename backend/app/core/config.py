"""Central configuration — everything tunable comes from the environment (12-factor)."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Hookscope"
    environment: str = "development"

    # --- infrastructure -------------------------------------------------
    database_url: str = "postgresql+asyncpg://hookscope:hookscope@localhost:5432/hookscope"
    redis_url: str = "redis://localhost:6379/0"

    # --- security --------------------------------------------------------
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # --- ingestion limits (protect the hot path) -------------------------
    max_payload_bytes: int = 1_000_000        # 1 MB per webhook body
    ingest_rate_limit_per_min: int = 600      # soft per-project window

    # --- replay engine ----------------------------------------------------
    replay_max_attempts: int = 5
    replay_timeout_seconds: float = 10.0
    replay_backoff_base_seconds: int = 2      # 2s, 4s, 8s, 16s, 32s

    # --- retention ---------------------------------------------------------
    event_retention_days: int = 30

    # Dev convenience: create tables on boot. DISABLE in prod, use Alembic.
    auto_create_tables: bool = True

    cors_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
