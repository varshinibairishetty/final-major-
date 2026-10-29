"""Open-Meteo weather service client and normalization."""

import logging
from datetime import datetime, timezone
from typing import Optional
import httpx
from app.core.config import settings
from app.schemas.location import Location
from app.schemas.weather import WeatherData
from app.services.cache import memory_cache

logger = logging.getLogger("smart_traffic_backend.weather")

# WMO Weather Interpretation Codes mapping
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm: Slight or moderate",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_weather_description(code: Optional[int]) -> str:
    """Translates a WMO weather code into human-readable text."""
    if code is None:
        return "Unknown condition"
    return WMO_DESCRIPTIONS.get(code, f"Weather code {code}")


class OpenMeteoWeatherService:
    """Fetches real-time weather observations from Open-Meteo with caching and timeout support."""

    @classmethod
    def _cache_key(cls, lat: float, lon: float) -> str:
        return f"weather:{lat:.4f}:{lon:.4f}"

    @classmethod
    async def fetch_weather_for_location(
        cls,
        location: Location,
        client: Optional[httpx.AsyncClient] = None,
        force_refresh: bool = False,
    ) -> WeatherData:
        """Queries Open-Meteo forecast API for current weather at the specified location."""
        cache_key = cls._cache_key(location.latitude, location.longitude)

        if not force_refresh:
            cached_data = memory_cache.get(cache_key)
            if cached_data is not None:
                # Return copy with is_cached=True
                return cached_data.model_copy(update={"is_cached": True})

        url = f"{settings.OPEN_METEO_BASE_URL.rstrip('/')}/forecast"
        params = {
            "latitude": location.latitude,
            "longitude": location.longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
            "timezone": "auto",
        }

        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS)
            should_close_client = True

        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()

            current = payload.get("current")
            if not current:
                raise ValueError("Open-Meteo response did not contain 'current' measurements block.")

            obs_time = current.get("time")
            if not obs_time:
                obs_time = datetime.now(timezone.utc).isoformat()

            weather_code = current.get("weather_code")
            weather_desc = get_weather_description(weather_code)

            data = WeatherData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=obs_time,
                temperature_c=current.get("temperature_2m"),
                relative_humidity_pct=current.get("relative_humidity_2m"),
                precipitation_mm=current.get("precipitation"),
                rain_mm=current.get("rain"),
                weather_code=weather_code,
                weather_description=weather_desc,
                wind_speed_kmh=current.get("wind_speed_10m"),
                visibility_meters=None,  # Not supported in standard current endpoint
                source="Open-Meteo",
                status="success",
                is_cached=False,
                error_message=None,
            )

            # Store in cache
            memory_cache.set(cache_key, data, settings.WEATHER_CACHE_TTL_SECONDS)
            return data

        except httpx.TimeoutException as exc:
            logger.warning("Open-Meteo timeout for location '%s': %s", location.id, str(exc))
            return WeatherData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=datetime.now(timezone.utc).isoformat(),
                weather_description="Telemetry unavailable (request timed out)",
                source="Open-Meteo",
                status="unavailable",
                is_cached=False,
                error_message="Open-Meteo service timed out.",
            )
        except Exception as exc:
            logger.error("Open-Meteo request error for location '%s': %s", location.id, str(exc))
            return WeatherData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=datetime.now(timezone.utc).isoformat(),
                weather_description="Telemetry unavailable (provider error)",
                source="Open-Meteo",
                status="unavailable",
                is_cached=False,
                error_message=f"Weather telemetry unavailable: {str(exc)}",
            )
        finally:
            if should_close_client:
                await client.aclose()
