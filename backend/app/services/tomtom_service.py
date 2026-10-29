"""TomTom Traffic Flow and Traffic Incidents service client with normalization and caching."""

import logging
import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
import httpx
from app.core.config import settings
from app.schemas.location import Location
from app.schemas.traffic import (
    LocationIncidentsResponse,
    TrafficFlowData,
    TrafficIncident,
)
from app.services.cache import memory_cache

logger = logging.getLogger("smart_traffic_backend.tomtom")

# TomTom iconCategory integer code definitions
TOMTOM_ICON_CATEGORIES: Dict[int, str] = {
    0: "UNKNOWN",
    1: "ACCIDENT",
    2: "FOG",
    3: "DANGEROUS_CONDITIONS",
    4: "RAIN",
    5: "ICE",
    6: "JAM",
    7: "LANE_CLOSED",
    8: "ROAD_CLOSED",
    9: "ROAD_WORKS",
    10: "WIND",
    11: "FLOODING",
    14: "BROKEN_DOWN_VEHICLE",
}

# Mapping magnitude of delay to normalized severity
TOMTOM_MAGNITUDE_SEVERITY: Dict[int, str] = {
    0: "unknown",
    1: "minor",
    2: "moderate",
    3: "major",
    4: "undefined",
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two geographic coordinates in kilometers."""
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius_km * c, 3)


class TomTomTrafficService:
    """Provides methods to query TomTom Flow Segment Data and Traffic Incidents."""

    @classmethod
    def is_api_key_configured(cls) -> bool:
        """Checks if a valid, non-placeholder TomTom API key is present."""
        key = settings.TOMTOM_API_KEY
        if not key or key == "your_tomtom_api_key_here":
            return False
        return True

    # -------------------------------------------------------------------------
    # 1. Traffic Flow Segment Service
    # -------------------------------------------------------------------------
    @classmethod
    def _flow_cache_key(cls, lat: float, lon: float) -> str:
        return f"traffic_flow:{lat:.4f}:{lon:.4f}"

    @classmethod
    async def fetch_traffic_flow(
        cls,
        location: Location,
        client: Optional[httpx.AsyncClient] = None,
        force_refresh: bool = False,
    ) -> TrafficFlowData:
        """Queries TomTom Flow Segment Data API for current traffic speed and delay."""
        now_iso = datetime.now(timezone.utc).isoformat()

        if not cls.is_api_key_configured():
            return TrafficFlowData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=now_iso,
                status="unconfigured",
                error_message="TOMTOM_API_KEY is not configured on the backend.",
                data_source="TomTom Traffic Flow",
            )

        cache_key = cls._flow_cache_key(location.latitude, location.longitude)
        if not force_refresh:
            cached_entry = memory_cache.get(cache_key)
            if cached_entry is not None:
                return cached_entry.model_copy(update={"is_cached": True})

        url = f"{settings.TOMTOM_BASE_URL.rstrip('/')}/traffic/services/4/flowSegmentData/relative0/10/json"
        params = {
            "point": f"{location.latitude},{location.longitude}",
            "unit": "KMPH",
            "key": settings.TOMTOM_API_KEY,
        }

        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS)
            should_close_client = True

        try:
            response = await client.get(url, params=params)
            
            if response.status_code == 404:
                return TrafficFlowData(
                    location_id=location.id,
                    location_name=location.name,
                    latitude=location.latitude,
                    longitude=location.longitude,
                    timestamp=now_iso,
                    status="no_segment_found",
                    error_message="No valid road segment found near configured coordinates at zoom 10.",
                    data_source="TomTom Traffic Flow",
                )

            response.raise_for_status()
            payload = response.json()

            flow = payload.get("flowSegmentData")
            if not flow:
                raise ValueError("TomTom response missing 'flowSegmentData' property.")

            current_speed = flow.get("currentSpeed")
            free_flow_speed = flow.get("freeFlowSpeed")
            current_travel_time = flow.get("currentTravelTime")
            free_flow_travel_time = flow.get("freeFlowTravelTime")

            delay_sec = None
            if current_travel_time is not None and free_flow_travel_time is not None:
                delay_sec = max(0, current_travel_time - free_flow_travel_time)

            congestion_ratio = None
            if current_speed is not None and free_flow_speed and free_flow_speed > 0:
                congestion_ratio = round(max(0.0, 1.0 - (current_speed / free_flow_speed)), 3)

            obs_timestamp = response.headers.get("Date", now_iso)

            data = TrafficFlowData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=obs_timestamp,
                current_speed_kmh=current_speed,
                free_flow_speed_kmh=free_flow_speed,
                current_travel_time_sec=current_travel_time,
                free_flow_travel_time_sec=free_flow_travel_time,
                delay_sec=delay_sec,
                congestion_ratio=congestion_ratio,
                confidence=flow.get("confidence"),
                road_closure=flow.get("roadClosure", False),
                road_category=flow.get("frc"),
                status="success",
                is_cached=False,
                error_message=None,
                data_source="TomTom Traffic Flow",
            )

            memory_cache.set(cache_key, data, settings.TRAFFIC_CACHE_TTL_SECONDS)
            return data

        except httpx.TimeoutException as exc:
            logger.warning("TomTom Traffic Flow timeout for '%s': %s", location.id, str(exc))
            return TrafficFlowData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=now_iso,
                status="unavailable",
                error_message="TomTom Traffic Flow API request timed out.",
                data_source="TomTom Traffic Flow",
            )
        except Exception as exc:
            logger.error("TomTom Traffic Flow error for '%s': %s", location.id, str(exc))
            return TrafficFlowData(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                timestamp=now_iso,
                status="unavailable",
                error_message=f"TomTom Flow API unavailable: {str(exc)}",
                data_source="TomTom Traffic Flow",
            )
        finally:
            if should_close_client:
                await client.aclose()

    # -------------------------------------------------------------------------
    # 2. Traffic Incidents Service
    # -------------------------------------------------------------------------
    @classmethod
    def _incidents_cache_key(cls, lat: float, lon: float, radius_km: float) -> str:
        return f"incidents:{lat:.4f}:{lon:.4f}:{radius_km:.1f}"

    @classmethod
    def _calculate_bounding_box(cls, lat: float, lon: float, radius_km: float) -> Tuple[float, float, float, float]:
        """Calculates approximate (min_lon, min_lat, max_lon, max_lat) bounding box."""
        # 1 degree lat approx 111 km; 1 degree lon approx 111 * cos(lat)
        delta_lat = radius_km / 111.0
        delta_lon = radius_km / (111.0 * math.cos(math.radians(lat)))
        return (lon - delta_lon, lat - delta_lat, lon + delta_lon, lat + delta_lat)

    @classmethod
    def normalize_incident_feature(
        cls, feature: dict, origin_lat: float, origin_lon: float
    ) -> Optional[TrafficIncident]:
        """Normalizes a raw GeoJSON-like incident feature from TomTom into TrafficIncident."""
        try:
            incident_id = str(feature.get("id") or "")
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})

            # Extract coordinates (Point [lon, lat] or first vertex of LineString)
            coords = geom.get("coordinates")
            if not coords:
                return None

            if isinstance(coords[0], (int, float)):
                inc_lon, inc_lat = float(coords[0]), float(coords[1])
            elif isinstance(coords[0], list):
                inc_lon, inc_lat = float(coords[0][0]), float(coords[0][1])
            else:
                return None

            icon_category = int(props.get("iconCategory", 0))
            category_name = TOMTOM_ICON_CATEGORIES.get(icon_category, "HAZARD")

            # Extract event descriptions
            events = props.get("events", [])
            descriptions = [e.get("description") for e in events if e.get("description")]
            full_description = "; ".join(descriptions) if descriptions else f"Reported {category_name.lower().replace('_', ' ')}"

            magnitude = props.get("magnitudeOfDelay")
            severity = TOMTOM_MAGNITUDE_SEVERITY.get(magnitude if magnitude is not None else 0, "unknown")

            distance = haversine_distance_km(origin_lat, origin_lon, inc_lat, inc_lon)

            # Strictly verify accident classification: only iconCategory 1 is a confirmed accident
            is_accident = (icon_category == 1)

            return TrafficIncident(
                id=f"tomtom-{incident_id}" if incident_id else f"inc-{inc_lat:.4f}-{inc_lon:.4f}",
                provider_id=incident_id,
                category=category_name,
                icon_category_code=icon_category,
                description=full_description,
                severity=severity,
                magnitude_of_delay=magnitude,
                delay_sec=props.get("delay"),
                latitude=inc_lat,
                longitude=inc_lon,
                distance_km=distance,
                start_time=props.get("startTime"),
                end_time=props.get("endTime"),
                from_location=props.get("from"),
                to_location=props.get("to"),
                is_confirmed_accident=is_accident,
            )
        except Exception as exc:
            logger.debug("Failed to normalize incident feature: %s", str(exc))
            return None

    @classmethod
    async def fetch_incidents_for_location(
        cls,
        location: Location,
        search_radius_km: float = 3.0,
        client: Optional[httpx.AsyncClient] = None,
        force_refresh: bool = False,
    ) -> LocationIncidentsResponse:
        """Queries TomTom Traffic Incidents API bounded around the specified location."""
        now_iso = datetime.now(timezone.utc).isoformat()

        if not cls.is_api_key_configured():
            return LocationIncidentsResponse(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                search_radius_km=search_radius_km,
                status="unconfigured",
                incident_count=None,  # Unknown status, NOT zero
                incidents=[],
                timestamp=now_iso,
                data_source="TomTom Traffic Incidents",
                error_message="TOMTOM_API_KEY is not configured on the backend.",
            )

        cache_key = cls._incidents_cache_key(location.latitude, location.longitude, search_radius_km)
        if not force_refresh:
            cached_entry = memory_cache.get(cache_key)
            if cached_entry is not None:
                return cached_entry.model_copy(update={"is_cached": True})

        min_lon, min_lat, max_lon, max_lat = cls._calculate_bounding_box(
            location.latitude, location.longitude, search_radius_km
        )
        bbox_str = f"{min_lon:.5f},{min_lat:.5f},{max_lon:.5f},{max_lat:.5f}"

        url = f"{settings.TOMTOM_BASE_URL.rstrip('/')}/traffic/services/5/incidentDetails"
        params = {
            "bbox": bbox_str,
            "language": "en-GB",
            "timeValidityFilter": "present",
            "key": settings.TOMTOM_API_KEY,
        }

        should_close_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS)
            should_close_client = True

        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()

            raw_incidents = payload.get("incidents", [])
            normalized_incidents: List[TrafficIncident] = []
            seen_ids = set()

            for item in raw_incidents:
                incident = cls.normalize_incident_feature(item, location.latitude, location.longitude)
                if incident and incident.id not in seen_ids:
                    # Enforce geographic matching radius
                    if incident.distance_km is not None and incident.distance_km <= search_radius_km:
                        seen_ids.add(incident.id)
                        normalized_incidents.append(incident)

            # Sort incidents by distance
            normalized_incidents.sort(key=lambda x: x.distance_km or 999.0)

            obs_timestamp = response.headers.get("Date", now_iso)

            data = LocationIncidentsResponse(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                search_radius_km=search_radius_km,
                status="success",
                incident_count=len(normalized_incidents),
                incidents=normalized_incidents,
                timestamp=obs_timestamp,
                is_cached=False,
                data_source="TomTom Traffic Incidents",
                error_message=None,
            )

            memory_cache.set(cache_key, data, settings.TRAFFIC_CACHE_TTL_SECONDS)
            return data

        except httpx.TimeoutException as exc:
            logger.warning("TomTom Traffic Incidents timeout for '%s': %s", location.id, str(exc))
            return LocationIncidentsResponse(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                search_radius_km=search_radius_km,
                status="unavailable",
                incident_count=None,  # Unknown status, NOT zero
                incidents=[],
                timestamp=now_iso,
                data_source="TomTom Traffic Incidents",
                error_message="TomTom Traffic Incidents request timed out.",
            )
        except Exception as exc:
            logger.error("TomTom Traffic Incidents error for '%s': %s", location.id, str(exc))
            return LocationIncidentsResponse(
                location_id=location.id,
                location_name=location.name,
                latitude=location.latitude,
                longitude=location.longitude,
                search_radius_km=search_radius_km,
                status="unavailable",
                incident_count=None,  # Unknown status, NOT zero
                incidents=[],
                timestamp=now_iso,
                data_source="TomTom Traffic Incidents",
                error_message=f"TomTom Traffic Incidents unavailable: {str(exc)}",
            )
        finally:
            if should_close_client:
                await client.aclose()
