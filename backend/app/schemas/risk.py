"""Pydantic schemas for accident risk estimation and severity classification."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class RiskFactors(BaseModel):
    """Normalized contributing factor weights influencing the composite risk score."""

    congestion_factor: float = Field(..., ge=0.0, le=1.0, description="Congestion and speed deficit risk weight")
    weather_factor: float = Field(..., ge=0.0, le=1.0, description="Precipitation, rain, and visibility risk weight")
    temporal_factor: float = Field(..., ge=0.0, le=1.0, description="Hour of day, rush hour, and night risk weight")
    road_geometry_factor: float = Field(..., ge=0.0, le=1.0, description="Junction/corridor geometry risk weight")


class ObservedTelemetryInputs(BaseModel):
    """Snapshot of empirical telemetry features fed into the risk estimation pipeline."""

    current_speed_kmh: Optional[int] = Field(None, description="Observed traffic speed")
    free_flow_speed_kmh: Optional[int] = Field(None, description="Reference free-flow speed")
    congestion_ratio: Optional[float] = Field(None, description="Calculated speed deficit ratio")
    weather_description: str = Field(..., description="Observed weather condition")
    rain_mm: Optional[float] = Field(None, description="Current rain precipitation in mm")
    road_type: str = Field(..., description="Roadway classification")
    hour_of_day: int = Field(..., description="Current local hour (0-23)")
    is_night: bool = Field(..., description="Night hours flag (22:00-05:00)")
    is_rush_hour: bool = Field(..., description="Peak office rush hour flag")


class RiskAssessmentResponse(BaseModel):
    """Composite accident risk assessment for a monitored Hyderabad traffic corridor."""

    location_id: str = Field(..., description="Unique identifier of the monitored location")
    location_name: str = Field(..., description="Name of the junction or corridor")
    timestamp: str = Field(..., description="ISO 8601 evaluation timestamp")
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Composite statistical accident risk index from 0.0 (minimal) to 100.0 (critical)",
    )
    risk_level: str = Field(
        ...,
        description="Categorical risk tier: 'LOW', 'MODERATE', 'HIGH', or 'CRITICAL'",
    )
    predicted_severity_class: str = Field(
        ...,
        description="ML-predicted severity category: 'Minor' or 'Severe/Fatal'",
    )
    severity_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Calibrated probability of incident severity given observed conditions",
    )
    contributing_factors: RiskFactors = Field(..., description="Individual risk factor components")
    observed_inputs: ObservedTelemetryInputs = Field(..., description="Empirical inputs passed to pipeline")
    model_status: str = Field(
        default="ml_model_active",
        description="Status of the risk pipeline: 'ml_model_active', 'heuristic_baseline', or 'unavailable'",
    )
    model_version: str = Field(default="v1.0-baseline-rf", description="Identifies the active model pipeline")
    limitations_note: str = Field(
        default=(
            "Statistical risk estimate derived from empirical weather, traffic dynamics, and historical "
            "severity patterns. Never represents a confirmed accident or verified CCTV camera detection."
        ),
        description="Disclaimer on data fidelity and probabilistic nature of predictions",
    )
