"""Automated tests for TomTom Traffic Flow, Incidents, and City Overview endpoints."""

from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from app.main import app
from app.services.cache import memory_cache

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear in-memory cache before each test."""
    memory_cache.clear()
    yield
    memory_cache.clear()


# ==============================================================================
# Traffic Flow Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_traffic_flow_success():
    """Verify that GET /api/v1/locations/{id}/traffic normalizes speed, delay, and congestion."""
    mock_payload = {
        "flowSegmentData": {
            "frc": "FRC1",
            "currentSpeed": 30,
            "freeFlowSpeed": 60,
            "currentTravelTime": 120,
            "freeFlowTravelTime": 60,
            "confidence": 0.95,
            "roadClosure": False,
        }
    }
    req = httpx.Request("GET", "https://api.tomtom.com/traffic/services/4/flowSegmentData")
    mock_response = httpx.Response(
        200, json=mock_payload, headers={"Date": "Thu, 29 Oct 2026 13:00:00 GMT"}, request=req
    )

    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/locations/hyd-gachibowli/traffic")
            assert response.status_code == 200
            data = response.json()

            assert data["location_id"] == "hyd-gachibowli"
            assert data["current_speed_kmh"] == 30
            assert data["free_flow_speed_kmh"] == 60
            assert data["current_travel_time_sec"] == 120
            assert data["free_flow_travel_time_sec"] == 60
            assert data["delay_sec"] == 60  # 120 - 60
            assert data["congestion_ratio"] == 0.5  # 1 - (30/60)
            assert data["confidence"] == 0.95
            assert data["road_closure"] is False
            assert data["road_category"] == "FRC1"
            assert data["status"] == "success"
            assert "limitation_note" in data


def test_traffic_flow_unconfigured_key():
    """Verify that unconfigured TomTom API key returns a structured status without throwing an error."""
    with patch.object(settings, "TOMTOM_API_KEY", ""):
        response = client.get("/api/v1/locations/hyd-gachibowli/traffic")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "unconfigured"
        assert data["current_speed_kmh"] is None
        assert "not configured" in data["error_message"].lower()


@pytest.mark.asyncio
async def test_traffic_flow_no_segment_found():
    """Verify that a 404 from TomTom maps to status 'no_segment_found' without fabricating speeds."""
    req = httpx.Request("GET", "https://api.tomtom.com/traffic/services/4/flowSegmentData")
    mock_response = httpx.Response(404, json={"error": "Not found"}, request=req)

    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/locations/hyd-hitech-city/traffic")
            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "no_segment_found"
            assert data["current_speed_kmh"] is None
            assert "no valid road segment found" in data["error_message"].lower()


@pytest.mark.asyncio
async def test_traffic_flow_timeout():
    """Verify that network timeout returns status 'unavailable'."""
    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.TimeoutException("TomTom flow timed out")

            response = client.get("/api/v1/locations/hyd-kukatpally/traffic")
            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "unavailable"
            assert data["current_speed_kmh"] is None
            assert "timed out" in data["error_message"].lower()


# ==============================================================================
# Traffic Incidents Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_traffic_incidents_success():
    """Verify incident filtering, distance calculation, deduplication, and accident categorization."""
    mock_payload = {
        "incidents": [
            {
                "id": "inc_accident_01",
                "geometry": {
                    "type": "Point",
                    "coordinates": [78.3495, 17.4410],  # ~0.1 km away
                },
                "properties": {
                    "iconCategory": 1,  # Accident
                    "magnitudeOfDelay": 3,  # Major
                    "delay": 600,
                    "events": [{"description": "Two vehicle collision on flyover"}],
                    "from": "Gachibowli Junction",
                    "to": "Bio Diversity",
                },
            },
            {
                "id": "inc_jam_02",
                "geometry": {
                    "type": "Point",
                    "coordinates": [78.3510, 17.4420],  # ~0.3 km away
                },
                "properties": {
                    "iconCategory": 6,  # Jam
                    "magnitudeOfDelay": 2,  # Moderate
                    "delay": 300,
                    "events": [{"description": "Stationary traffic"}],
                },
            },
            {
                "id": "inc_far_away_03",
                "geometry": {
                    "type": "Point",
                    "coordinates": [78.4500, 17.5000],  # > 10 km away (should be filtered out by radius)
                },
                "properties": {
                    "iconCategory": 9,  # Roadworks
                    "magnitudeOfDelay": 1,
                    "events": [{"description": "Paving works"}],
                },
            },
        ]
    }
    req = httpx.Request("GET", "https://api.tomtom.com/traffic/services/5/incidentDetails")
    mock_response = httpx.Response(200, json=mock_payload, request=req)

    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/locations/hyd-gachibowli/incidents?radius_km=3.0")
            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "success"
            assert data["incident_count"] == 2  # Third one filtered out due to distance
            assert len(data["incidents"]) == 2

            # First incident is an accident
            acc = data["incidents"][0]
            assert acc["provider_id"] == "inc_accident_01"
            assert acc["category"] == "ACCIDENT"
            assert acc["is_confirmed_accident"] is True
            assert acc["severity"] == "major"
            assert acc["delay_sec"] == 600
            assert acc["distance_km"] <= 1.0

            # Second incident is a jam (NOT an accident!)
            jam = data["incidents"][1]
            assert jam["provider_id"] == "inc_jam_02"
            assert jam["category"] == "JAM"
            assert jam["is_confirmed_accident"] is False  # Must NOT be inferred as accident
            assert jam["severity"] == "moderate"


@pytest.mark.asyncio
async def test_traffic_incidents_empty_response():
    """Verify that an empty response indicates zero active incidents (not an error)."""
    req = httpx.Request("GET", "https://api.tomtom.com/traffic/services/5/incidentDetails")
    mock_response = httpx.Response(200, json={"incidents": []}, request=req)

    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            response = client.get("/api/v1/locations/hyd-madhapur/incidents")
            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "success"
            assert data["incident_count"] == 0
            assert data["incidents"] == []


def test_traffic_incidents_unconfigured_key():
    """Verify that unconfigured TomTom API key leaves incident_count as None (unknown, NOT zero)."""
    with patch.object(settings, "TOMTOM_API_KEY", ""):
        response = client.get("/api/v1/locations/hyd-gachibowli/incidents")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "unconfigured"
        assert data["incident_count"] is None  # Crucial: unknown, NOT zero
        assert data["incidents"] == []
        assert "not configured" in data["error_message"].lower()


@pytest.mark.asyncio
async def test_traffic_incidents_timeout():
    """Verify that a timeout on incidents leaves count as None and surfaces unavailable status."""
    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.TimeoutException("Incidents timed out")

            response = client.get("/api/v1/locations/hyd-jubilee-hills/incidents")
            assert response.status_code == 200
            data = response.json()

            assert data["status"] == "unavailable"
            assert data["incident_count"] is None  # Unknown, not zero
            assert "timed out" in data["error_message"].lower()


# ==============================================================================
# Overview Endpoint Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_traffic_overview_endpoint():
    """Verify that GET /api/v1/traffic-overview aggregates all locations with source status."""
    mock_weather = {
        "latitude": 17.44,
        "longitude": 78.35,
        "current": {
            "time": "2026-10-29T18:45",
            "temperature_2m": 28.0,
            "relative_humidity_2m": 60,
            "precipitation": 0.0,
            "rain": 0.0,
            "weather_code": 0,
            "wind_speed_10m": 10.0,
        },
    }
    mock_flow = {
        "flowSegmentData": {
            "frc": "FRC1",
            "currentSpeed": 40,
            "freeFlowSpeed": 50,
            "currentTravelTime": 80,
            "freeFlowTravelTime": 65,
            "confidence": 0.9,
            "roadClosure": False,
        }
    }
    mock_incidents = {"incidents": []}

    async def mock_handler(request: httpx.Request):
        url_str = str(request.url)
        if "open-meteo" in url_str:
            return httpx.Response(200, json=mock_weather, request=request)
        elif "flowSegmentData" in url_str:
            return httpx.Response(200, json=mock_flow, request=request)
        elif "incidentDetails" in url_str:
            return httpx.Response(200, json=mock_incidents, request=request)
        return httpx.Response(404, request=request)

    transport = httpx.MockTransport(mock_handler)

    with patch.object(settings, "TOMTOM_API_KEY", "mock_valid_key"):
        with patch("httpx.AsyncClient", return_value=httpx.AsyncClient(transport=transport)):
            response = client.get("/api/v1/traffic-overview")
            assert response.status_code == 200
            data = response.json()

            assert data["city"] == "Hyderabad"
            assert data["total_locations"] == 5
            assert len(data["locations"]) == 5
            assert data["sources_status"]["open_meteo"] == "operational"
            assert data["sources_status"]["tomtom_traffic_flow"] == "configured"

            # Check individual location item
            first_loc = data["locations"][0]
            assert "weather" in first_loc
            assert "traffic_flow" in first_loc
            assert "incidents" in first_loc
            assert "risk_assessment" in first_loc
            assert first_loc["weather"]["temperature_c"] == 28.0
            assert first_loc["traffic_flow"]["current_speed_kmh"] == 40
            assert first_loc["incidents"]["incident_count"] == 0
            assert first_loc["overall_status"] == "healthy"
            assert first_loc["risk_assessment"] is not None
            assert first_loc["risk_assessment"]["status"] == "success"
            assert first_loc["risk_assessment"]["risk_score"] is not None
            assert first_loc["risk_assessment"]["model_status"] == "ml_model_active"


def test_invalid_location_404_for_all_endpoints():
    """Verify that all location-specific endpoints return 404 for unknown location ID."""
    r_traffic = client.get("/api/v1/locations/unknown-location/traffic")
    assert r_traffic.status_code == 404

    r_incidents = client.get("/api/v1/locations/unknown-location/incidents")
    assert r_incidents.status_code == 404

    r_weather = client.get("/api/v1/locations/unknown-location/weather")
    assert r_weather.status_code == 404
