"""Global application configuration loaded from environment variables."""

import os
from pathlib import Path
from typing import List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine directory paths for resilient configuration resolution
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent
DEFAULT_LOCATIONS_FILE = WORKSPACE_ROOT / "data" / "locations" / "hyderabad_hotspots.json"

# Potential .env file locations (current working dir, backend dir, workspace root)
ENV_CANDIDATES = [
    Path.cwd() / ".env",
    BACKEND_DIR / ".env",
    WORKSPACE_ROOT / ".env",
]
RESOLVED_ENV_FILES = [str(p) for p in ENV_CANDIDATES if p.is_file()]
if not RESOLVED_ENV_FILES:
    RESOLVED_ENV_FILES = [".env"]


class Settings(BaseSettings):
    """Application configuration and settings specifications.

    Secrets such as TOMTOM_API_KEY are optional at startup and are never
    printed in string representations or logs.
    """

    model_config = SettingsConfigDict(
        env_file=tuple(RESOLVED_ENV_FILES),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server Specification
    PROJECT_NAME: str = "Multimodal AI-Based Smart Traffic Management and Accident Prediction System"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    # CORS Settings (restricted to local frontend development origins)
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # External APIs (Optional for Phase 1 minimal operation)
    TOMTOM_API_KEY: Optional[str] = Field(
        default="",
        description="Optional TomTom API key. Not required for Phase 1 local startup or tests.",
    )
    TOMTOM_BASE_URL: str = "https://api.tomtom.com"
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"

    # Location Data Source
    LOCATIONS_FILE_PATH: Path = Field(
        default=DEFAULT_LOCATIONS_FILE,
        description="Path to the authoritative JSON file containing Hyderabad monitoring locations.",
    )

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

    def safe_dict(self) -> dict:
        """Returns non-sensitive configuration values safe for logging and debugging."""
        return {
            "PROJECT_NAME": self.PROJECT_NAME,
            "VERSION": self.VERSION,
            "ENVIRONMENT": self.ENVIRONMENT,
            "BACKEND_HOST": self.BACKEND_HOST,
            "BACKEND_PORT": self.BACKEND_PORT,
            "CORS_ORIGINS": self.CORS_ORIGINS,
            "TOMTOM_API_KEY_CONFIGURED": bool(self.TOMTOM_API_KEY and self.TOMTOM_API_KEY != "your_tomtom_api_key_here"),
            "LOCATIONS_FILE_PATH": str(self.LOCATIONS_FILE_PATH),
        }

    def __repr__(self) -> str:
        safe = self.safe_dict()
        return f"Settings({safe})"


settings = Settings()
