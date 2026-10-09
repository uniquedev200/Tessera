import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"

class Settings(BaseSettings):
    GROQ_API_KEY_70B: str = ""
    GROQ_API_KEY_32B: str = ""
    GROQ_MODEL_70B: str = "openai/gpt-oss-120b"
    GROQ_MODEL_32B: str = "qwen/qwen3.8-27b"

    UPSTASH_VECTOR_REST_URL: str = ""
    UPSTASH_VECTOR_REST_TOKEN: str = ""

    DATABASE_URL: str = ""
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    CORS_ORIGINS: str = "*"
    PORT: int = 8000
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
