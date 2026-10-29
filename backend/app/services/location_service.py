"""Service for loading and querying authoritative Hyderabad monitoring locations."""

import json
from pathlib import Path
from typing import Optional
from fastapi import HTTPException
from app.core.config import settings
from app.schemas.location import Location, LocationListResponse


class LocationService:
    """Provides access to configured monitoring locations from the authoritative JSON source."""

    _cached_data: Optional[LocationListResponse] = None

    @classmethod
    def get_locations_file_path(cls) -> Path:
        """Resolves the authoritative locations file path."""
        path = settings.LOCATIONS_FILE_PATH
        if path.is_file():
            return path
        
        # Fallback check relative to current file
        fallback = Path(__file__).resolve().parent.parent.parent.parent / "data" / "locations" / "hyderabad_hotspots.json"
        if fallback.is_file():
            return fallback

        raise FileNotFoundError(f"Authoritative locations file not found at: {path} or {fallback}")

    @classmethod
    def load_locations(cls, force_reload: bool = False) -> LocationListResponse:
        """Loads and parses the locations configuration, using in-memory cache unless reloaded."""
        if cls._cached_data is not None and not force_reload:
            return cls._cached_data

        try:
            file_path = cls.get_locations_file_path()
            with open(file_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)

            monitoring_points = [
                Location(**point) for point in raw_data.get("monitoring_points", [])
            ]

            response = LocationListResponse(
                city=raw_data.get("city", "Hyderabad"),
                state=raw_data.get("state", "Telangana"),
                country=raw_data.get("country", "India"),
                total=len(monitoring_points),
                locations=monitoring_points,
                note=raw_data.get(
                    "description",
                    "Approximate public coordinates for area monitoring, not verified CCTV or hardware camera positions.",
                ),
            )

            cls._cached_data = response
            return response
        except FileNotFoundError as fnf:
            raise HTTPException(
                status_code=500,
                detail=f"Location configuration file is missing: {str(fnf)}",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse location configuration: {str(exc)}",
            )

    @classmethod
    def get_location_by_id(cls, location_id: str) -> Optional[Location]:
        """Queries a single location by its unique identifier."""
        data = cls.load_locations()
        for loc in data.locations:
            if loc.id.lower() == location_id.lower():
                return loc
        return None
