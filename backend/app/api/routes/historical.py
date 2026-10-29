"""Endpoints for querying historical accident distributions, trends, and records."""

import csv
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from app.core.config import WORKSPACE_ROOT
from app.services.location_service import LocationService
from app.services.tomtom_service import haversine_distance_km

router = APIRouter(prefix="/historical", tags=["Historical Analytics"])
logger = logging.getLogger("smart_traffic_backend.historical")

HISTORICAL_CSV_PATH = WORKSPACE_ROOT / "data" / "historical" / "raw" / "sample_accidents_raw.csv"


def _load_historical_rows() -> List[Dict[str, Any]]:
    """Reads raw CSV records into memory."""
    if not HISTORICAL_CSV_PATH.is_file():
        return []
    rows = []
    with open(HISTORICAL_CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows


@router.get(
    "/summary",
    summary="Get Aggregated Historical Accident Distributions and Patterns",
)
async def get_historical_summary(
    location_id: Optional[str] = Query(
        default=None, description="Optional Hyderabad location ID to filter nearby incidents"
    ),
    radius_km: float = Query(
        default=5.0, description="Proximity radius in km when location_id is specified"
    ),
):
    """Aggregates accident records by severity, weather, road type, and time of day."""
    rows = _load_historical_rows()
    total_in_db = len(rows)

    loc = LocationService.get_location_by_id(location_id) if location_id else None

    # Filter by location proximity if requested
    filtered_rows = []
    for r in rows:
        if loc:
            try:
                lat = float(r.get("latitude", 0))
                lon = float(r.get("longitude", 0))
                dist = haversine_distance_km(loc.latitude, loc.longitude, lat, lon)
                if dist > radius_km:
                    continue
            except (ValueError, TypeError):
                continue
        filtered_rows.append(r)

    # Distributions
    by_severity: Dict[str, int] = {}
    by_weather: Dict[str, int] = {}
    by_road_type: Dict[str, int] = {}
    by_hour: Dict[int, int] = {h: 0 for h in range(24)}
    by_traffic_density: Dict[str, int] = {}

    for r in filtered_rows:
        sev = r.get("accident_severity", "Unknown")
        by_severity[sev] = by_severity.get(sev, 0) + 1

        w = r.get("weather_conditions", "Unknown")
        by_weather[w] = by_weather.get(w, 0) + 1

        rt = r.get("road_type", "Unknown")
        by_road_type[rt] = by_road_type.get(rt, 0) + 1

        td = r.get("traffic_density", "Unknown")
        by_traffic_density[td] = by_traffic_density.get(td, 0) + 1

        time_str = r.get("time", "")
        if ":" in time_str:
            try:
                h = int(time_str.split(":")[0])
                if 0 <= h < 24:
                    by_hour[h] += 1
            except ValueError:
                pass

    return {
        "metadata": {
            "data_source": "Hyderabad Sample Accident Dataset (Pipeline Benchmark)",
            "total_records_analyzed": len(filtered_rows),
            "total_records_dataset": total_in_db,
            "date_range": "2023-01-01 to 2023-12-31",
            "geographical_scope": f"Hyderabad Metro Area{f' (within {radius_km}km of {loc.name})' if loc else ''}",
            "is_synthetic_benchmark": True,
            "documentation_note": (
                "Historical records represent a documented pipeline verification sample. "
                "Used for model benchmarking and pattern visualization, not certified police statistics."
            ),
        },
        "distributions": {
            "by_severity": by_severity,
            "by_weather": by_weather,
            "by_road_type": by_road_type,
            "by_hour": [{"hour": h, "count": by_hour[h]} for h in range(24)],
            "by_traffic_density": by_traffic_density,
        },
    }


@router.get(
    "/records",
    summary="List Filtered Historical Accident Records",
)
async def get_historical_records(
    location_id: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    weather: Optional[str] = Query(default=None),
    road_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Returns paginated historical records with optional metadata filtering."""
    rows = _load_historical_rows()
    loc = LocationService.get_location_by_id(location_id) if location_id else None

    results = []
    for r in rows:
        if loc:
            try:
                lat = float(r.get("latitude", 0))
                lon = float(r.get("longitude", 0))
                dist = haversine_distance_km(loc.latitude, loc.longitude, lat, lon)
                if dist > 8.0:
                    continue
            except (ValueError, TypeError):
                continue

        if severity and r.get("accident_severity", "").lower() != severity.lower():
            continue
        if weather and r.get("weather_conditions", "").lower() != weather.lower():
            continue
        if road_type and r.get("road_type", "").lower() != road_type.lower():
            continue

        results.append(r)

    total_matched = len(results)
    paged = results[offset : offset + limit]

    return {
        "total": total_matched,
        "offset": offset,
        "limit": limit,
        "records": paged,
    }
