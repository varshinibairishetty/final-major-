"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for Multimodal AI-Based Smart Traffic Management and Accident "
        "Prediction System in Hyderabad, India."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    """Root metadata endpoint."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "phase": "Phase 0 - Scaffolding",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for uptime and service monitoring."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
