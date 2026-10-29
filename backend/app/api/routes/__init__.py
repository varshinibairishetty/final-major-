"""Aggregation router for versioned API endpoints."""

from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.locations import router as locations_router

api_router = APIRouter(prefix="/api/v1")

# Register route modules under /api/v1
api_router.include_router(health_router)
api_router.include_router(locations_router)

__all__ = ["api_router"]
