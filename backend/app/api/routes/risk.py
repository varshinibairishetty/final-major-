"""Accident risk assessment API endpoints."""

from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.risk import RiskAssessmentResponse
from app.services.location_service import LocationService
from app.services.risk_engine import RiskPredictionEngine

router = APIRouter(tags=["Risk Assessment"])


@router.get(
    "/locations/{location_id}/risk",
    response_model=RiskAssessmentResponse,
    summary="Get Accident Risk Assessment for Location",
)
async def get_location_risk(
    location_id: str,
    force_refresh: bool = Query(
        default=False,
        description="Whether to bypass telemetry cache when evaluating risk",
    ),
):
    """Computes real-time statistical accident risk combining live congestion, weather, and historical ML severity model."""
    location = LocationService.get_location_by_id(location_id)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location with identifier '{location_id}' not found.",
        )

    return await RiskPredictionEngine.evaluate_location_risk(
        location=location, force_refresh=force_refresh
    )
