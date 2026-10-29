"""Global application configuration loaded from environment variables."""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration and credentials specification."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server Configuration
    PROJECT_NAME: str = "Multimodal Smart Traffic AI"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    # CORS Settings
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # External APIs
    TOMTOM_API_KEY: str = Field(
        default="",
        description="TomTom Traffic API Key. Required for live traffic flow and incident endpoints.",
    )
    TOMTOM_BASE_URL: str = "https://api.tomtom.com"
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"

    # Timeouts & Caching
    REQUEST_TIMEOUT_SECONDS: float = 5.0
    TRAFFIC_CACHE_TTL_SECONDS: int = 300
    WEATHER_CACHE_TTL_SECONDS: int = 900

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
