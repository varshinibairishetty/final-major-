"""Automated tests for Phase 1 endpoints using FastAPI TestClient."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify that GET / returns the project information and operational status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "project" in data
    assert "Multimodal" in data["project"]
    assert data["status"] == "operational"
    assert "Phase 4" in data["phase"]
    assert "endpoints" in data


def test_health_endpoint():
    """Verify that GET /api/v1/health returns a healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data
    assert "version" in data


def test_locations_list_endpoint():
    """Verify that GET /api/v1/locations returns the configured Hyderabad monitoring points."""
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    data = response.json()

    assert data["city"] == "Hyderabad"
    assert data["state"] == "Telangana"
    assert data["country"] == "India"
    assert data["total"] >= 5
    assert len(data["locations"]) == data["total"]
    assert "not verified CCTV" in data["note"]

    # Verify that the 5 required locations are present
    location_names = [loc["name"] for loc in data["locations"]]
    assert any("Gachibowli" in name for name in location_names)
    assert any("Hitech City" in name for name in location_names)
    assert any("Madhapur" in name for name in location_names)
    assert any("Kukatpally" in name for name in location_names)
    assert any("Jubilee Hills" in name for name in location_names)

    # Validate coordinate ranges and required keys for all returned points
    for loc in data["locations"]:
        assert "id" in loc and isinstance(loc["id"], str)
        assert "name" in loc and isinstance(loc["name"], str)
        assert "latitude" in loc and 17.0 <= loc["latitude"] <= 18.0
        assert "longitude" in loc and 78.0 <= loc["longitude"] <= 79.0


def test_single_location_lookup():
    """Verify single location querying by unique ID."""
    response = client.get("/api/v1/locations/hyd-gachibowli")
    assert response.status_code == 200
    loc = response.json()
    assert loc["id"] == "hyd-gachibowli"
    assert "Gachibowli" in loc["name"]
    assert pytest.approx(loc["latitude"], 0.01) == 17.4401
    assert pytest.approx(loc["longitude"], 0.01) == 78.3489


def test_nonexistent_location_returns_404():
    """Verify that querying an unknown location ID returns a structured 404 response."""
    response = client.get("/api/v1/locations/non-existent-hotspot")
    assert response.status_code == 404
    detail = response.json().get("detail", "")
    assert "not found" in detail.lower()
