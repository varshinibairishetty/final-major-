"""Automated tests for historical data preprocessing, model loading, and risk estimation API."""

from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.risk import RiskAssessmentResponse
from app.services.cache import memory_cache
from app.services.risk_engine import RiskPredictionEngine
from scripts.data_prep import preprocess_accident_data, generate_quality_report

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before each test."""
    memory_cache.clear()
    yield
    memory_cache.clear()


def test_data_preprocessing_pipeline():
    """Verify that preprocessing produces clean, pre-crash features and a binary severity target."""
    df = preprocess_accident_data()
    assert len(df) > 0
    assert "is_severe_accident" in df.columns
    assert set(df["is_severe_accident"].unique()).issubset({0, 1})

    # Verify pre-crash temporal features
    assert "hour_of_day" in df.columns
    assert "day_of_week" in df.columns
    assert "is_night" in df.columns
    assert "is_rush_hour" in df.columns

    # Verify absence of post-crash leakage columns
    leakage_columns = ["casualties", "vehicles_involved", "hospital_arrival_time", "fatalities_count"]
    for col in leakage_columns:
        assert col not in df.columns

    report = generate_quality_report(df)
    assert report["duplicate_accident_ids"] == 0
    assert report["total_records"] == len(df)
    assert "severe_ratio" in report["class_distribution"]


def test_risk_model_loading():
    """Verify that the fitted model artifact loads correctly and exposes predict_proba."""
    model = RiskPredictionEngine.load_model(force_reload=True)
    assert model is not None
    assert hasattr(model, "predict_proba")


@pytest.mark.asyncio
async def test_risk_endpoint_with_active_ml_model():
    """Verify that GET /api/v1/locations/{id}/risk computes multi-factor risk with ML severity."""
    mock_weather = {
        "latitude": 17.44,
        "longitude": 78.35,
        "current": {
            "time": "2026-10-29T18:45",
            "temperature_2m": 27.5,
            "relative_humidity_2m": 70,
            "precipitation": 2.0,
            "rain": 1.5,
            "weather_code": 61,
            "wind_speed_10m": 12.0,
        },
    }
    mock_flow = {
        "flowSegmentData": {
            "frc": "FRC1",
            "currentSpeed": 25,
            "freeFlowSpeed": 60,
            "currentTravelTime": 140,
            "freeFlowTravelTime": 60,
            "confidence": 0.95,
            "roadClosure": False,
        }
    }

    req = httpx.Request("GET", "https://api.test/route")

    async def mock_get(url, *args, **kwargs):
        url_str = str(url)
        if "open-meteo" in url_str or "forecast" in url_str:
            return httpx.Response(200, json=mock_weather, request=req)
        elif "flowSegmentData" in url_str:
            return httpx.Response(200, json=mock_flow, request=req)
        return httpx.Response(404, request=req)

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as patched_client_get:
        patched_client_get.side_effect = mock_get

        response = client.get("/api/v1/locations/hyd-gachibowli/risk")
        assert response.status_code == 200
        data = response.json()

        assert data["location_id"] == "hyd-gachibowli"
        assert "Gachibowli" in data["location_name"]
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert data["predicted_severity_class"] in ["Minor", "Severe/Fatal"]
        assert 0.0 <= data["severity_probability"] <= 1.0
        assert data["model_status"] == "ml_model_active"

        # Factors breakdown
        factors = data["contributing_factors"]
        assert "congestion_factor" in factors
        assert "weather_factor" in factors
        assert "temporal_factor" in factors
        assert "road_geometry_factor" in factors

        # Limitation disclaimer
        assert "Never represents a confirmed accident" in data["limitations_note"]


@pytest.mark.asyncio
async def test_risk_endpoint_fallback_to_heuristic():
    """Verify graceful fallback to heuristic baseline when model artifact cannot be loaded."""
    with patch.object(RiskPredictionEngine, "load_model", return_value=None):
        response = client.get("/api/v1/locations/hyd-hitech-city/risk")
        assert response.status_code == 200
        data = response.json()

        assert data["location_id"] == "hyd-hitech-city"
        assert 0.0 <= data["risk_score"] <= 100.0
        assert data["model_status"] == "heuristic_baseline"
        assert "Severe/Fatal" in data["predicted_severity_class"] or "Minor" in data["predicted_severity_class"]


def test_risk_endpoint_invalid_location_404():
    """Verify that querying risk for an unknown location ID returns HTTP 404."""
    response = client.get("/api/v1/locations/non-existent-hotspot/risk")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
