"""Automated tests for Open-Meteo weather integration and endpoint."""

from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.cache import memory_cache

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear in-memory cache before each test."""
    memory_cache.clear()
    yield
    memory_cache.clear()


@pytest.mark.asyncio
async def test_weather_endpoint_success():
    """Verify that GET /api/v1/locations/{id}/weather successfully normalizes Open-Meteo telemetry."""
    mock_payload = {
        "latitude": 17.44,
        "longitude": 78.35,
        "current": {
            "time": "2026-10-29T18:45",
            "temperature_2m": 29.2,
            "relative_humidity_2m": 62,
            "precipitation": 1.5,
            "rain": 1.2,
            "weather_code": 61,
            "wind_speed_10m": 14.5,
        },
    }

    req = httpx.Request("GET", "https://api.open-meteo.com/v1/forecast")
    mock_response = httpx.Response(200, json=mock_payload, request=req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        response = client.get("/api/v1/locations/hyd-gachibowli/weather")
        assert response.status_code == 200
        data = response.json()

        assert data["location_id"] == "hyd-gachibowli"
        assert "Gachibowli" in data["location_name"]
        assert data["temperature_c"] == 29.2
        assert data["relative_humidity_pct"] == 62
        assert data["precipitation_mm"] == 1.5
        assert data["rain_mm"] == 1.2
        assert data["weather_code"] == 61
        assert "Slight rain" in data["weather_description"]
        assert data["wind_speed_kmh"] == 14.5
        assert data["source"] == "Open-Meteo"
        assert data["status"] == "success"
        assert data["is_cached"] is False


@pytest.mark.asyncio
async def test_weather_caching():
    """Verify that consecutive queries serve from the in-memory cache."""
    mock_payload = {
        "latitude": 17.44,
        "longitude": 78.35,
        "current": {
            "time": "2026-10-29T18:45",
            "temperature_2m": 31.0,
            "relative_humidity_2m": 50,
            "precipitation": 0.0,
            "rain": 0.0,
            "weather_code": 0,
            "wind_speed_10m": 8.0,
        },
    }
    req = httpx.Request("GET", "https://api.open-meteo.com/v1/forecast")
    mock_response = httpx.Response(200, json=mock_payload, request=req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        # First request fetches from provider
        r1 = client.get("/api/v1/locations/hyd-gachibowli/weather")
        assert r1.status_code == 200
        assert r1.json()["is_cached"] is False
        assert mock_get.call_count == 1

        # Second request serves from cache without hitting external API
        r2 = client.get("/api/v1/locations/hyd-gachibowli/weather")
        assert r2.status_code == 200
        assert r2.json()["is_cached"] is True
        assert mock_get.call_count == 1


@pytest.mark.asyncio
async def test_weather_timeout_handling():
    """Verify that request timeouts return an explicit unavailable state without crashing or faking data."""
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")

        response = client.get("/api/v1/locations/hyd-hitech-city/weather")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "unavailable"
        assert data["temperature_c"] is None
        assert data["precipitation_mm"] is None
        assert "timed out" in data["error_message"].lower()


@pytest.mark.asyncio
async def test_weather_provider_error():
    """Verify that HTTP 500 error from provider surfaces degraded/unavailable status."""
    req = httpx.Request("GET", "https://api.open-meteo.com/v1/forecast")
    mock_response = httpx.Response(500, text="Internal Server Error", request=req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        response = client.get("/api/v1/locations/hyd-madhapur/weather")
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "unavailable"
        assert data["temperature_c"] is None
        assert data["error_message"] is not None


def test_weather_invalid_location_404():
    """Verify that querying weather for a non-existent location ID returns HTTP 404."""
    response = client.get("/api/v1/locations/unknown-location-id/weather")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
