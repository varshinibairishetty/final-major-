"""Traffic flow, incident, and aggregated overview endpoints."""

import asyncio
from datetime import datetime, timezone
from typing import List
import httpx
from fastapi import APIRouter, HTTPException, Query, status
from app.core.config import settings
from app.schemas.traffic import (
    LocationIncidentsResponse,
    LocationOverview,
    TrafficFlowData,
    TrafficOverviewResponse,
)
from app.services.location_service import LocationService
from app.services.tomtom_service import TomTomTrafficService
from app.services.weather_service import OpenMeteoWeatherService

router = APIRouter(tags=["Traffic"])


@router.get(
    "/locations/{location_id}/traffic",
    response_model=TrafficFlowData,
    summary="Get Traffic Flow for Location",
)
async def get_location_traffic_flow(
    location_id: str,
    force_refresh: bool = Query(
        default=False,
        description="Whether to bypass the in-memory cache and query TomTom API directly",
    ),
):
    """Retrieves current speed, free-flow speed, travel times, and congestion metrics for a location."""
    location = LocationService.get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' not found.",
        )

    return await TomTomTrafficService.fetch_traffic_flow(
        location=location, force_refresh=force_refresh
    )


@router.get(
    "/locations/{location_id}/incidents",
    response_model=LocationIncidentsResponse,
    summary="Get Reported Traffic Incidents for Location",
)
async def get_location_incidents(
    location_id: str,
    radius_km: float = Query(
        default=3.0,
        ge=0.5,
        le=10.0,
        description="Search radius in kilometers around the location center",
    ),
    force_refresh: bool = Query(
        default=False,
        description="Whether to bypass the in-memory cache and query TomTom API directly",
    ),
):
    """Retrieves active provider-reported traffic hazards, roadworks, and accidents within radius_km."""
    location = LocationService.get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' not found.",
        )

    return await TomTomTrafficService.fetch_incidents_for_location(
        location=location, search_radius_km=radius_km, force_refresh=force_refresh
    )


@router.get(
    "/traffic-overview",
    response_model=TrafficOverviewResponse,
    summary="Get Aggregated City Traffic and Weather Overview",
)
async def get_traffic_overview(
    force_refresh: bool = Query(
        default=False,
        description="Whether to bypass the in-memory cache for all location queries",
    ),
):
    """Aggregates real-time weather, traffic flow, and incident metrics across all monitored Hyderabad locations.

    Executes concurrent queries to minimize total latency while maintaining per-source availability metadata.
    """
    locations_response = LocationService.load_locations()
    locations = locations_response.locations

    # Execute all queries concurrently using a shared HTTP client session
    async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:

        async def fetch_composite_location(loc) -> LocationOverview:
            # Query weather, traffic flow, and incidents concurrently for this location
            weather_task = OpenMeteoWeatherService.fetch_weather_for_location(
                loc, client=client, force_refresh=force_refresh
            )
            flow_task = TomTomTrafficService.fetch_traffic_flow(
                loc, client=client, force_refresh=force_refresh
            )
            incidents_task = TomTomTrafficService.fetch_incidents_for_location(
                loc, client=client, force_refresh=force_refresh
            )

            weather, flow, incidents = await asyncio.gather(
                weather_task, flow_task, incidents_task
            )

            # Determine composite health status
            statuses = [weather.status, flow.status, incidents.status]
            if all(s == "success" for s in statuses):
                overall = "healthy"
            elif any(s in ("unavailable", "unconfigured", "degraded") for s in statuses):
                overall = "partially_degraded"
            else:
                overall = "unavailable"

            return LocationOverview(
                location_id=loc.id,
                location_name=loc.name,
                latitude=loc.latitude,
                longitude=loc.longitude,
                area_type=loc.area_type,
                weather=weather,
                traffic_flow=flow,
                incidents=incidents,
                overall_status=overall,
            )

        location_overviews: List[LocationOverview] = await asyncio.gather(
            *[fetch_composite_location(loc) for loc in locations]
        )

    # Determine overall source availability
    tomtom_status = (
        "configured" if TomTomTrafficService.is_api_key_configured() else "unconfigured"
    )
    weather_failures = any(
        overview.weather.status != "success" for overview in location_overviews
    )
    open_meteo_status = "degraded" if weather_failures else "operational"

    return TrafficOverviewResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        city="Hyderabad",
        total_locations=len(location_overviews),
        locations=location_overviews,
        sources_status={
            "open_meteo": open_meteo_status,
            "tomtom_traffic_flow": tomtom_status,
            "tomtom_incidents": tomtom_status,
        },
    )
