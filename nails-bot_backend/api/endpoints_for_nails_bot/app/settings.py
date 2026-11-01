# app/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # БД
    database_url: str = Field(alias="DATABASE_URL")

    # Celery / Redis
    celery_broker_url: str = Field(
        default="redis://redis:6379/0",
        alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://redis:6379/1",
        alias="CELERY_RESULT_BACKEND",
    )

    # Опционально — если у тебя есть такие переменные
    upload_token: str = Field(min_length=32, alias="UPLOAD_TOKEN")
    api_url: str | None = Field(default=None, alias="API_URL")

    # Важно:
    # - читаем .env
    # - регистронезависимо
    # - extra="allow" — НЕ падать, если увидим переменные, которых нет в модели (например, REDIS_URL)
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )

    inbox_dir: str = Field(default="/var/lib/ingest/inbox", alias="INBOX_DIR")

settings = Settings()
