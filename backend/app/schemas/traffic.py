"""Pydantic schemas for TomTom Traffic Flow and Incident reporting."""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.risk import RiskAssessmentResponse
from app.schemas.weather import WeatherData


class TrafficFlowData(BaseModel):
    """Normalized traffic flow metrics for a monitored junction or corridor."""

    location_id: str = Field(..., description="Unique identifier of the monitored location")
    location_name: str = Field(..., description="Name of the monitored junction or corridor")
    latitude: float = Field(..., description="Target query latitude")
    longitude: float = Field(..., description="Target query longitude")
    timestamp: str = Field(..., description="ISO 8601 observation or response timestamp")
    current_speed_kmh: Optional[int] = Field(None, description="Observed traffic speed in km/h")
    free_flow_speed_kmh: Optional[int] = Field(None, description="Free-flow speed under optimal conditions in km/h")
    current_travel_time_sec: Optional[int] = Field(None, description="Current travel time in seconds for the segment")
    free_flow_travel_time_sec: Optional[int] = Field(None, description="Free-flow travel time in seconds for the segment")
    delay_sec: Optional[int] = Field(None, description="Estimated delay in seconds (currentTravelTime - freeFlowTravelTime)")
    congestion_ratio: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Speed-based congestion index: max(0, 1 - (currentSpeed / freeFlowSpeed))",
    )
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="TomTom flow calculation confidence score")
    road_closure: bool = Field(default=False, description="Whether the flow segment reports an active road closure")
    road_category: Optional[str] = Field(None, description="Functional Road Class (e.g., FRC0, FRC1)")
    status: str = Field(
        default="success",
        description="Data acquisition status: 'success', 'unavailable', 'unconfigured', or 'no_segment_found'",
    )
    is_cached: bool = Field(default=False, description="Whether this response was served from memory cache")
    error_message: Optional[str] = Field(None, description="Diagnostic error message when status is not 'success'")
    data_source: str = Field(default="TomTom Traffic Flow", description="Originating data provider")
    limitation_note: str = Field(
        default=(
            "Point-based segment query identifies the nearest mapped road segment at zoom level 10. "
            "In complex multi-tier flyovers or parallel service roads, telemetry reflects the matched segment."
        ),
        description="Known technical limitation of point-to-segment resolution",
    )


class TrafficIncident(BaseModel):
    """Normalized provider-reported traffic incident event."""

    id: str = Field(..., description="Internal normalized incident identifier")
    provider_id: str = Field(..., description="Raw provider incident identifier")
    category: str = Field(
        ...,
        description="Normalized category: 'ACCIDENT', 'JAM', 'ROAD_WORKS', 'LANE_CLOSED', 'ROAD_CLOSED', 'HAZARD', 'WEATHER_HAZARD', or 'UNKNOWN'",
    )
    icon_category_code: int = Field(..., description="TomTom raw iconCategory integer code")
    description: str = Field(..., description="Provider description of the incident event")
    severity: str = Field(default="unknown", description="Normalized severity: 'minor', 'moderate', 'major', or 'unknown'")
    magnitude_of_delay: Optional[int] = Field(None, description="Magnitude of delay index (0=unknown, 1=minor, 2=moderate, 3=major, 4=undefined)")
    delay_sec: Optional[int] = Field(None, description="Delay caused by the incident in seconds")
    latitude: float = Field(..., description="Incident epicenter latitude coordinate")
    longitude: float = Field(..., description="Incident epicenter longitude coordinate")
    distance_km: Optional[float] = Field(None, description="Haversine distance in kilometers from monitored location center")
    start_time: Optional[str] = Field(None, description="Reported start time in ISO 8601")
    end_time: Optional[str] = Field(None, description="Estimated end time in ISO 8601")
    from_location: Optional[str] = Field(None, description="Starting intersection/roadway description")
    to_location: Optional[str] = Field(None, description="Ending intersection/roadway description")
    is_confirmed_accident: bool = Field(
        default=False,
        description="True ONLY if verified by provider as a vehicular accident (iconCategory=1). Never inferred from congestion.",
    )


class LocationIncidentsResponse(BaseModel):
    """Response containing provider-reported incidents associated with a monitored location."""

    location_id: str = Field(..., description="Unique identifier of the monitored location")
    location_name: str = Field(..., description="Name of the monitored junction or corridor")
    latitude: float = Field(..., description="Center latitude coordinate")
    longitude: float = Field(..., description="Center longitude coordinate")
    search_radius_km: float = Field(default=3.0, description="Search radius in kilometers used for incident association")
    status: str = Field(
        default="success",
        description="Status: 'success', 'unavailable', or 'unconfigured'",
    )
    incident_count: Optional[int] = Field(
        None,
        description="Total matching incidents found. Note: None indicates provider failure/unconfigured (status unknown), NOT zero.",
    )
    incidents: List[TrafficIncident] = Field(default_factory=list, description="List of normalized incident records")
    timestamp: str = Field(..., description="ISO 8601 query timestamp")
    is_cached: bool = Field(default=False, description="Whether this response was served from cache")
    data_source: str = Field(default="TomTom Traffic Incidents", description="Originating data provider")
    error_message: Optional[str] = Field(None, description="Diagnostic error message if status is not 'success'")
    matching_method: str = Field(
        default="Haversine distance within search_radius_km from junction coordinates",
        description="Documented geographic matching algorithm",
    )


class LocationOverview(BaseModel):
    """Comprehensive composite overview for a single monitoring location."""

    location_id: str
    location_name: str
    latitude: float
    longitude: float
    area_type: Optional[str] = None
    weather: WeatherData
    traffic_flow: TrafficFlowData
    incidents: LocationIncidentsResponse
    risk_assessment: Optional[RiskAssessmentResponse] = None
    overall_status: str = Field(
        default="healthy",
        description="Aggregated health: 'healthy', 'partially_degraded', 'unavailable', or 'unconfigured'",
    )


class TrafficOverviewResponse(BaseModel):
    """Aggregated city-wide overview for all monitored Hyderabad locations."""

    timestamp: str = Field(..., description="ISO 8601 aggregation timestamp")
    city: str = Field(default="Hyderabad", description="Monitored city")
    total_locations: int = Field(..., description="Number of monitored locations included")
    locations: List[LocationOverview] = Field(..., description="Location-wise aggregated status and metrics")
    sources_status: Dict[str, str] = Field(..., description="Operational status of each integrated API provider")
