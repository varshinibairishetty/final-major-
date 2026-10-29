"""FastAPI routes for video upload, vehicle detection jobs, and artifact streaming."""

import os
from pathlib import Path
import uuid
from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from app.schemas.video import VideoAnalysisResult, VideoUploadResponse
from app.services.location_service import LocationService
from app.services.video_service import (
    PREVIEW_DIR,
    UPLOAD_DIR,
    VideoAnalyticsService,
)

router = APIRouter(prefix="/videos", tags=["Video Analytics"])

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB limit


@router.post(
    "/upload",
    response_model=VideoUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload Traffic Video for Vehicle Detection & Flow Analysis",
)
async def upload_traffic_video(
    file: UploadFile = File(..., description="Video file to analyze (MP4, AVI, MOV, WebM)"),
    location_id: str = Form(..., description="Configured Hyderabad location ID"),
):
    """Receives a recorded traffic video file, validates metadata, and schedules background YOLO analysis."""
    # Validate location
    loc = LocationService.get_location_by_id(location_id)
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' is not recognized.",
        )

    # Validate file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    job_id = f"job-{uuid.uuid4().hex[:10]}"
    safe_filename = f"{job_id}{ext}"
    dest_path = UPLOAD_DIR / safe_filename
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Stream file to disk while enforcing size limit
    file_size = 0
    try:
        with open(dest_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE_BYTES:
                    dest_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video file exceeds maximum allowed size of 100MB.",
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video: {str(exc)}",
        )

    # Create job entry and dispatch background processing
    job = VideoAnalyticsService.create_job(
        job_id=job_id,
        location_id=location_id,
        filename=file.filename or safe_filename,
        file_size_bytes=file_size,
    )
    VideoAnalyticsService.start_analysis(job_id=job_id, video_path=dest_path)

    return VideoUploadResponse(
        job_id=job_id,
        location_id=loc.id,
        location_name=loc.name,
        filename=file.filename or safe_filename,
        file_size_bytes=file_size,
        status="pending",
        message="Video uploaded successfully. YOLOv8 vehicle detection and tracking scheduled.",
    )


@router.get(
    "/jobs",
    response_model=List[VideoAnalysisResult],
    summary="List Video Analytics Jobs",
)
async def list_video_jobs(
    location_id: Optional[str] = Query(
        default=None, description="Optional filter by Hyderabad location ID"
    ),
):
    """Lists video analysis jobs with status, vehicle counts, and derived flow metrics."""
    return VideoAnalyticsService.list_jobs(location_id=location_id)


@router.get(
    "/{job_id}",
    response_model=VideoAnalysisResult,
    summary="Get Video Analysis Job Status and Metrics",
)
async def get_video_job(job_id: str):
    """Retrieves progress, vehicle counts by class, peak vehicles, flow rate, and density estimate."""
    job = VideoAnalyticsService.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video analysis job '{job_id}' not found.",
        )
    return job


@router.get(
    "/{job_id}/preview",
    summary="Get Annotated Preview Keyframe",
)
async def get_preview_image(job_id: str):
    """Serves the peak-traffic annotated JPEG keyframe showing bounding boxes and tracking IDs."""
    preview_file = PREVIEW_DIR / f"{job_id}_preview.jpg"
    if not preview_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preview snapshot for job '{job_id}' is not yet available or failed.",
        )
    return FileResponse(str(preview_file), media_type="image/jpeg")


@router.get(
    "/{job_id}/stream",
    summary="Stream Uploaded Video File",
)
async def stream_video(job_id: str):
    """Streams the stored video for web browser playback."""
    job = VideoAnalyticsService.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video analysis job '{job_id}' not found.",
        )

    ext = Path(job.filename).suffix.lower()
    video_path = UPLOAD_DIR / f"{job_id}{ext}"
    if not video_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video file for job '{job_id}' is not found on disk.",
        )

    media_type = "video/mp4" if ext == ".mp4" else "application/octet-stream"
    return FileResponse(str(video_path), media_type=media_type)
