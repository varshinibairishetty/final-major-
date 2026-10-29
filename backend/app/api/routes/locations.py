"""Endpoints for querying monitored Hyderabad locations."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.location import Location, LocationListResponse
from app.services.location_service import LocationService

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=LocationListResponse, summary="List Monitored Locations")
async def list_locations():
    """Returns the list of configured Hyderabad traffic monitoring points with coordinates.

    Note: These points represent approximate public area coordinates for geospatial
    queries, not verified CCTV cameras or physical hardware sensor positions.
    """
    return LocationService.load_locations()


@router.get("/{location_id}", response_model=Location, summary="Get Single Location Details")
async def get_location(location_id: str):
    """Retrieves metadata and coordinates for a single monitoring location by its unique ID."""
    location = LocationService.get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' not found.",
        )
    return location
