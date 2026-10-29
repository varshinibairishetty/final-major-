"""Automated tests for video upload, validation, and analytics endpoints."""

import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.video_service import VideoAnalyticsService

client = TestClient(app)


def test_video_upload_invalid_location_404():
    """Verify that uploading a video for a nonexistent location returns 404."""
    dummy_file = io.BytesIO(b"fake video content")
    response = client.post(
        "/api/v1/videos/upload",
        data={"location_id": "nonexistent-loc"},
        files={"file": ("traffic.mp4", dummy_file, "video/mp4")},
    )
    assert response.status_code == 404
    assert "not recognized" in response.json()["detail"]


def test_video_upload_unsupported_format_400():
    """Verify that uploading an unsupported format returns 400 Bad Request."""
    dummy_file = io.BytesIO(b"text file content")
    response = client.post(
        "/api/v1/videos/upload",
        data={"location_id": "hyd-hitech-city"},
        files={"file": ("notes.txt", dummy_file, "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported video format" in response.json()["detail"]


def test_video_upload_valid_file_creates_job():
    """Verify that uploading a valid MP4 creates a pending/processing job."""
    dummy_file = io.BytesIO(b"fake mp4 video bytes")
    response = client.post(
        "/api/v1/videos/upload",
        data={"location_id": "hyd-hitech-city"},
        files={"file": ("cctv_corridor.mp4", dummy_file, "video/mp4")},
    )
    assert response.status_code == 202
    data = response.json()
    assert data["location_id"] == "hyd-hitech-city"
    assert "job-" in data["job_id"]
    assert data["status"] in ("pending", "processing", "failed")

    # Verify retrieval
    job_resp = client.get(f"/api/v1/videos/{data['job_id']}")
    assert job_resp.status_code == 200
    job_data = job_resp.json()
    assert job_data["job_id"] == data["job_id"]
    assert "Raw vehicle count alone is insufficient" in job_data["disclaimer_note"]


def test_video_jobs_listing():
    """Verify listing of video jobs."""
    response = client.get("/api/v1/videos/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_video_job_not_found_404():
    """Verify that querying a missing job returns 404."""
    response = client.get("/api/v1/videos/nonexistent-job-id")
    assert response.status_code == 404
