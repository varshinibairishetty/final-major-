"""Pydantic schemas for video upload, vehicle tracking, and traffic flow metrics."""

from typing import Dict, Optional
from pydantic import BaseModel, Field


class VehicleCounts(BaseModel):
    """Counts of unique tracked vehicles across supported COCO vehicle categories."""

    car: int = Field(default=0, description="Unique cars detected and tracked across frames")
    bus: int = Field(default=0, description="Unique buses detected and tracked across frames")
    truck: int = Field(default=0, description="Unique trucks detected and tracked across frames")
    motorcycle: int = Field(
        default=0, description="Unique motorcycles/scooters detected and tracked across frames"
    )
    total_unique: int = Field(
        default=0, description="Sum of all unique tracked vehicles observed during video playback"
    )


class VideoAnalysisResult(BaseModel):
    """Complete video analytics results and derived traffic flow metrics."""

    job_id: str = Field(description="Unique identifier for the video analysis job")
    location_id: str = Field(description="Associated configured Hyderabad location identifier")
    location_name: str = Field(description="Human-readable name of the associated location")
    filename: str = Field(description="Original uploaded filename")
    file_size_bytes: int = Field(description="File size in bytes")
    status: str = Field(
        description="Current processing status: pending, processing, completed, or failed"
    )
    progress_pct: int = Field(default=0, description="Analysis completion percentage (0-100)")
    created_at: str = Field(description="ISO timestamp of upload")
    completed_at: Optional[str] = Field(default=None, description="ISO timestamp of completion")

    # Video properties
    video_duration_sec: Optional[float] = Field(
        default=None, description="Total video duration in seconds"
    )
    fps: Optional[float] = Field(default=None, description="Native video frames per second")
    total_frames_analyzed: Optional[int] = Field(
        default=None, description="Total frame count processed by YOLO detector"
    )

    # Vehicle metrics
    counts: VehicleCounts = Field(default_factory=VehicleCounts)
    peak_concurrent_vehicles: Optional[int] = Field(
        default=None, description="Maximum number of active vehicles in any single frame"
    )
    average_vehicles_per_frame: Optional[float] = Field(
        default=None, description="Mean vehicles present per analyzed frame"
    )
    vehicle_flow_rate_per_min: Optional[float] = Field(
        default=None,
        description="Vehicles per minute based on total unique vehicles and duration",
    )
    density_estimate: Optional[str] = Field(
        default=None,
        description="Categorical density estimate: low, moderate, high, or severe",
    )
    density_score: Optional[float] = Field(
        default=None, description="Normalized density index from 0.0 (empty) to 1.0 (gridlock)"
    )

    # Artifacts & Error handling
    preview_image_path: Optional[str] = Field(
        default=None, description="API path to annotated keyframe preview"
    )
    annotated_video_path: Optional[str] = Field(
        default=None, description="API path to annotated video clip if generated"
    )
    error_message: Optional[str] = Field(
        default=None, description="Detailed error description if status is failed"
    )
    disclaimer_note: str = Field(
        default=(
            "Analysis conducted on uploaded recorded video clip. Raw vehicle count alone is "
            "insufficient to establish congestion; flow rate is computed over the observation duration "
            "and density reflects camera field-of-view occupancy, distinct from network-wide flow."
        ),
        description="Mandatory methodological limitation disclaimer",
    )


class VideoUploadResponse(BaseModel):
    """Response returned immediately upon successful video file upload."""

    job_id: str
    location_id: str
    location_name: str
    filename: str
    file_size_bytes: int
    status: str
    message: str
