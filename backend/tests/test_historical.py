"""Automated tests for historical accident analytics and dataset querying."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_historical_summary_endpoint():
    """Verify aggregated distributions from historical dataset."""
    response = client.get("/api/v1/historical/summary")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert data["metadata"]["total_records_dataset"] == 850
    assert data["metadata"]["is_synthetic_benchmark"] is True
    assert "distributions" in data
    assert "by_severity" in data["distributions"]
    assert "by_weather" in data["distributions"]
    assert "by_road_type" in data["distributions"]
    assert len(data["distributions"]["by_hour"]) == 24


def test_historical_summary_with_location_filter():
    """Verify location-proximity filtering for historical accidents."""
    response = client.get("/api/v1/historical/summary?location_id=hyd-gachibowli&radius_km=10.0")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "Gachibowli Junction" in data["metadata"]["geographical_scope"]
    assert data["metadata"]["total_records_analyzed"] > 0


def test_historical_records_pagination():
    """Verify paginated records querying with filters."""
    response = client.get("/api/v1/historical/records?limit=10&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert data["limit"] == 10
    assert data["offset"] == 0
    assert len(data["records"]) == 10

    # Filter by severity
    sev_resp = client.get("/api/v1/historical/records?severity=Serious&limit=5")
    assert sev_resp.status_code == 200
    sev_data = sev_resp.json()
    assert len(sev_data["records"]) > 0
    for r in sev_data["records"]:
        assert r["accident_severity"].lower() == "serious"
