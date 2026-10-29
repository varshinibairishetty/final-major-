"""Pydantic schemas for Open-Meteo weather data."""

from typing import Optional
from pydantic import BaseModel, Field


class WeatherData(BaseModel):
    """Normalized weather observations for a traffic monitoring point."""

    location_id: str = Field(..., description="Unique identifier of the monitored location")
    location_name: str = Field(..., description="Name of the monitored junction or corridor")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    timestamp: str = Field(..., description="ISO 8601 observation timestamp")
    temperature_c: Optional[float] = Field(None, description="Current ambient temperature in Celsius")
    relative_humidity_pct: Optional[float] = Field(None, description="Relative humidity percentage")
    precipitation_mm: Optional[float] = Field(None, description="Precipitation rate in millimeters")
    rain_mm: Optional[float] = Field(None, description="Rain amount in millimeters")
    weather_code: Optional[int] = Field(None, description="WMO weather interpretation code")
    weather_description: str = Field(..., description="Human-readable weather condition summary")
    wind_speed_kmh: Optional[float] = Field(None, description="Wind speed in km/h at 10m height")
    visibility_meters: Optional[float] = Field(None, description="Surface visibility in meters, if reported")
    source: str = Field(default="Open-Meteo", description="Data provider")
    status: str = Field(
        default="success",
        description="Data acquisition status: 'success', 'unavailable', or 'degraded'",
    )
    is_cached: bool = Field(default=False, description="Whether this response was served from cache")
    error_message: Optional[str] = Field(None, description="Error or diagnostic message if unavailable")
