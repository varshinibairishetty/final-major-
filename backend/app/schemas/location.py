"""Pydantic schemas for Hyderabad monitoring locations."""

from typing import List, Optional
from pydantic import BaseModel, Field


class Location(BaseModel):
    """Schema representing an individual monitored traffic location."""

    id: str = Field(..., description="Unique identifier for the location", examples=["hyd-gachibowli"])
    name: str = Field(..., description="Human-readable name of the junction/area", examples=["Gachibowli Junction"])
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Approximate public latitude coordinate", examples=[17.4401])
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Approximate public longitude coordinate", examples=[78.3489])
    area_type: Optional[str] = Field(None, description="Classification of the traffic zone", examples=["Major IT Corridor / Arterial Junction"])
    description: Optional[str] = Field(None, description="Contextual description of the monitoring point")


class LocationListResponse(BaseModel):
    """Schema representing the list of configured monitoring locations."""

    city: str = Field(default="Hyderabad", description="Monitored city")
    state: str = Field(default="Telangana", description="State")
    country: str = Field(default="India", description="Country")
    total: int = Field(..., description="Total count of configured monitoring locations")
    locations: List[Location] = Field(..., description="List of location records")
    note: str = Field(
        default="Approximate public coordinates for area monitoring, not verified CCTV or hardware camera positions.",
        description="Disclaimer on data fidelity and coordinate nature",
    )
