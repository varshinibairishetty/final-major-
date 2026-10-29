"""Video analytics service utilizing YOLOv8 and ByteTrack for vehicle detection and flow estimation."""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional
import cv2
import numpy as np
from app.core.config import BACKEND_DIR, WORKSPACE_ROOT
from app.schemas.video import VehicleCounts, VideoAnalysisResult
from app.services.location_service import LocationService

logger = logging.getLogger("smart_traffic_backend.video")

# Configuration for storage paths
UPLOAD_DIR = WORKSPACE_ROOT / "data" / "uploads" / "videos"
PREVIEW_DIR = WORKSPACE_ROOT / "data" / "uploads" / "previews"
METADATA_FILE = WORKSPACE_ROOT / "data" / "uploads" / "jobs.json"
MODEL_PATH = BACKEND_DIR / "app" / "models" / "yolov8n.pt"

# COCO vehicle class mappings
VEHICLE_CLASS_MAP = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Thread pool for asynchronous background video processing
_executor = ThreadPoolExecutor(max_workers=2)


class VideoAnalyticsService:
    """Manages video storage, asynchronous YOLO detection, vehicle tracking, and metric derivation."""

    _jobs: Dict[str, VideoAnalysisResult] = {}
    _initialized: bool = False

    @classmethod
    def _ensure_directories(cls):
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def load_persisted_jobs(cls):
        """Loads previously saved jobs metadata on startup."""
        cls._ensure_directories()
        if METADATA_FILE.is_file():
            try:
                with open(METADATA_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        job = VideoAnalysisResult(**item)
                        cls._jobs[job.job_id] = job
            except Exception as e:
                logger.warning("Could not load persisted video jobs: %s", str(e))
        cls._initialized = True

    @classmethod
    def _save_persisted_jobs(cls):
        """Persists current jobs metadata to disk."""
        cls._ensure_directories()
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump([j.model_dump() for j in cls._jobs.values()], f, indent=2)
        except Exception as e:
            logger.error("Failed to persist video jobs metadata: %s", str(e))

    @classmethod
    def list_jobs(cls, location_id: Optional[str] = None) -> List[VideoAnalysisResult]:
        if not cls._initialized:
            cls.load_persisted_jobs()
        jobs = list(cls._jobs.values())
        if location_id:
            jobs = [j for j in jobs if j.location_id == location_id]
        return sorted(jobs, key=lambda j: j.created_at, reverse=True)

    @classmethod
    def get_job(cls, job_id: str) -> Optional[VideoAnalysisResult]:
        if not cls._initialized:
            cls.load_persisted_jobs()
        return cls._jobs.get(job_id)

    @classmethod
    def create_job(
        cls,
        job_id: str,
        location_id: str,
        filename: str,
        file_size_bytes: int,
    ) -> VideoAnalysisResult:
        if not cls._initialized:
            cls.load_persisted_jobs()

        loc = LocationService.get_location_by_id(location_id)
        location_name = loc.name if loc else location_id

        job = VideoAnalysisResult(
            job_id=job_id,
            location_id=location_id,
            location_name=location_name,
            filename=filename,
            file_size_bytes=file_size_bytes,
            status="pending",
            progress_pct=0,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        cls._jobs[job_id] = job
        cls._save_persisted_jobs()
        return job

    @classmethod
    def start_analysis(cls, job_id: str, video_path: Path):
        """Dispatches video processing to the background thread pool."""
        _executor.submit(cls._process_video_sync, job_id, video_path)

    @classmethod
    def _process_video_sync(cls, job_id: str, video_path: Path):
        """Synchronous video processing loop executed inside background worker thread."""
        logger.info("Starting YOLOv8 video tracking for job '%s'", job_id)
        job = cls.get_job(job_id)
        if not job:
            return

        job.status = "processing"
        job.progress_pct = 5
        cls._save_persisted_jobs()

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            job.status = "failed"
            job.error_message = "Failed to open video file. Format may be corrupt or unsupported."
            cls._save_persisted_jobs()
            return

        try:
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = float(cap.get(cv2.CAP_PROP_FPS))
            if fps <= 0:
                fps = 25.0
            duration_sec = round(total_frames / fps, 2) if total_frames > 0 else 0.0

            job.video_duration_sec = duration_sec
            job.fps = round(fps, 2)

            # Lazy-load YOLO model inside worker thread
            from ultralytics import YOLO

            model_file = str(MODEL_PATH) if MODEL_PATH.is_file() else "yolov8n.pt"
            model = YOLO(model_file)

            # Tracking structures: maps track_id -> category string
            tracked_vehicles: Dict[int, str] = {}
            concurrent_counts: List[int] = []
            peak_frame_img: Optional[np.ndarray] = None
            max_concurrent = 0

            # Process every Nth frame to optimize speed while retaining tracking continuity
            frame_skip = max(1, int(round(fps / 10.0)))  # target ~10 fps for detection
            processed_count = 0
            frame_idx = 0

            # Video preview destination
            preview_filename = f"{job_id}_preview.jpg"
            preview_filepath = PREVIEW_DIR / preview_filename

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % frame_skip == 0:
                    # Run YOLO tracking with ByteTrack on supported vehicle classes
                    results = model.track(
                        frame,
                        persist=True,
                        classes=list(VEHICLE_CLASS_MAP.keys()),
                        verbose=False,
                    )

                    res = results[0]
                    active_tracks_in_frame = 0

                    if res.boxes is not None and res.boxes.id is not None:
                        boxes = res.boxes.xyxy.cpu().numpy()
                        track_ids = res.boxes.id.int().cpu().numpy()
                        classes = res.boxes.cls.int().cpu().numpy()

                        active_tracks_in_frame = len(track_ids)

                        for track_id, cls_id in zip(track_ids, classes):
                            class_name = VEHICLE_CLASS_MAP.get(int(cls_id), "car")
                            tracked_vehicles[int(track_id)] = class_name

                    concurrent_counts.append(active_tracks_in_frame)
                    processed_count += 1

                    if active_tracks_in_frame > max_concurrent:
                        max_concurrent = active_tracks_in_frame
                        # Save annotated peak frame
                        try:
                            annotated_frame = res.plot()
                            peak_frame_img = annotated_frame
                        except Exception:
                            peak_frame_img = frame

                    # Update progress periodically
                    if total_frames > 0 and processed_count % 10 == 0:
                        progress = min(95, int((frame_idx / total_frames) * 90) + 5)
                        job.progress_pct = progress

                frame_idx += 1

            cap.release()

            # Save preview snapshot
            if peak_frame_img is not None:
                cv2.imwrite(str(preview_filepath), peak_frame_img)
                job.preview_image_path = f"/api/v1/videos/{job_id}/preview"

            # Compute category aggregations
            counts_by_cat = {"car": 0, "bus": 0, "truck": 0, "motorcycle": 0}
            for tid, cname in tracked_vehicles.items():
                if cname in counts_by_cat:
                    counts_by_cat[cname] += 1

            total_unique = len(tracked_vehicles)
            job.counts = VehicleCounts(
                car=counts_by_cat["car"],
                bus=counts_by_cat["bus"],
                truck=counts_by_cat["truck"],
                motorcycle=counts_by_cat["motorcycle"],
                total_unique=total_unique,
            )

            job.total_frames_analyzed = processed_count
            job.peak_concurrent_vehicles = max_concurrent
            avg_concurrent = (
                round(sum(concurrent_counts) / len(concurrent_counts), 2)
                if concurrent_counts
                else 0.0
            )
            job.average_vehicles_per_frame = avg_concurrent

            # Flow rate (vehicles per minute observed)
            effective_duration_min = max(0.1, duration_sec / 60.0)
            flow_rate = round(total_unique / effective_duration_min, 1)
            job.vehicle_flow_rate_per_min = flow_rate

            # Density estimation: relative occupancy heuristic within camera frame
            # 0-3 avg veh: low; 4-7: moderate; 8-13: high; >= 14: severe
            norm_density = min(1.0, round(avg_concurrent / 14.0, 3))
            job.density_score = norm_density
            if norm_density >= 0.75:
                density_str = "severe"
            elif norm_density >= 0.50:
                density_str = "high"
            elif norm_density >= 0.25:
                density_str = "moderate"
            else:
                density_str = "low"
            job.density_estimate = density_str

            job.status = "completed"
            job.progress_pct = 100
            job.completed_at = datetime.now(timezone.utc).isoformat()
            cls._save_persisted_jobs()
            logger.info(
                "Completed YOLOv8 video analysis for job '%s': %d unique vehicles, flow: %.1f veh/min",
                job_id,
                total_unique,
                flow_rate,
            )

        except Exception as exc:
            logger.exception("Error analyzing video for job '%s': %s", job_id, str(exc))
            job.status = "failed"
            job.error_message = f"Computer vision processing error: {str(exc)}"
            cls._save_persisted_jobs()
            if cap.isOpened():
                cap.release()
