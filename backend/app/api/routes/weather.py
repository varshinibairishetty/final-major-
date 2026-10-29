"""Weather API endpoints for monitored Hyderabad locations."""

from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.weather import WeatherData
from app.services.location_service import LocationService
from app.services.weather_service import OpenMeteoWeatherService

router = APIRouter(tags=["Weather"])


@router.get(
    "/locations/{location_id}/weather",
    response_model=WeatherData,
    summary="Get Current Weather for Location",
)
async def get_location_weather(
    location_id: str,
    force_refresh: bool = Query(
        default=False,
        description="Whether to bypass the in-memory TTL cache and fetch fresh data from Open-Meteo",
    ),
):
    """Retrieves current atmospheric weather conditions for a monitored Hyderabad location from Open-Meteo."""
    location = LocationService.get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' not found.",
        )

    return await OpenMeteoWeatherService.fetch_weather_for_location(
        location=location, force_refresh=force_refresh
    )
