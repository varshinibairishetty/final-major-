"""FastAPI application entry point for the Smart Traffic Management & Accident Prediction System."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core.config import settings

# Configure structured application logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("smart_traffic_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for clean startup and shutdown."""
    # Startup: log safe summary without exposing secrets
    logger.info("Starting up %s (v%s) in '%s' environment", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    logger.info("Configured CORS origins: %s", settings.CORS_ORIGINS)
    logger.info("Authoritative locations file: %s", settings.LOCATIONS_FILE_PATH)
    logger.info("TomTom API key configured: %s", bool(settings.TOMTOM_API_KEY and settings.TOMTOM_API_KEY != "your_tomtom_api_key_here"))
    # Zero external API calls at startup (satisfies project constraint)
    yield
    # Shutdown
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for Multimodal AI-Based Smart Traffic Management and Accident "
        "Prediction System monitoring corridors in Hyderabad, India."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS - restricted to local frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root metadata endpoint reporting service status and active phase."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "phase": "Phase 6 - End-to-End Verification & Project Readiness",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/v1/health",
            "locations": "/api/v1/locations",
            "weather": "/api/v1/locations/{location_id}/weather",
            "traffic": "/api/v1/locations/{location_id}/traffic",
            "incidents": "/api/v1/locations/{location_id}/incidents",
            "traffic_overview": "/api/v1/traffic-overview",
            "risk": "/api/v1/locations/{location_id}/risk",
        },
    }


# Include versioned API router under /api/v1
app.include_router(api_router)
