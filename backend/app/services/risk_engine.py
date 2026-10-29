"""Accident risk estimation engine synthesizing live telemetry and trained ML models."""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple
import joblib
import pandas as pd
from app.core.config import settings
from app.schemas.location import Location
from app.schemas.risk import (
    ObservedTelemetryInputs,
    RiskAssessmentResponse,
    RiskFactors,
)
from app.services.tomtom_service import TomTomTrafficService
from app.services.weather_service import OpenMeteoWeatherService

logger = logging.getLogger("smart_traffic_backend.risk_engine")

# Candidate model artifact paths
MODEL_CANDIDATE_PATHS = [
    Path(__file__).resolve().parent.parent / "models" / "model_baseline.joblib",
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "historical" / "processed" / "model_baseline.joblib",
]


class RiskPredictionEngine:
    """Combines empirical telemetry (weather, speed deficit, roadway type) with trained ML models."""

    _model = None
    _model_loaded = False

    @classmethod
    def load_model(cls, force_reload: bool = False):
        """Loads the fitted scikit-learn pipeline from disk."""
        if cls._model is not None and not force_reload:
            return cls._model

        for path in MODEL_CANDIDATE_PATHS:
            if path.is_file():
                try:
                    cls._model = joblib.load(path)
                    cls._model_loaded = True
                    logger.info("Loaded baseline risk model from %s", path)
                    return cls._model
                except Exception as exc:
                    logger.error("Failed to load model from %s: %s", path, str(exc))

        logger.warning("No pre-trained model artifact found. Risk engine will operate in explainable heuristic baseline mode.")
        cls._model = None
        cls._model_loaded = False
        return None

    @classmethod
    def _extract_road_attributes(cls, location: Location) -> Tuple[str, int]:
        """Maps location metadata into standardized road_type and speed_limit."""
        area_type = (location.area_type or "").lower()
        if "flyover" in area_type:
            return "flyover", 80
        elif "junction" in area_type or "intersection" in area_type:
            return "junction", 50
        elif "arterial" in area_type or "corridor" in area_type:
            return "arterial", 60
        elif "residential" in area_type:
            return "residential", 40
        return "arterial", 60

    @classmethod
    def _infer_surface_condition(cls, weather_desc: str, rain_mm: Optional[float]) -> str:
        """Determines road surface condition from live weather."""
        desc_lower = weather_desc.lower()
        if (rain_mm and rain_mm >= 3.0) or "heavy rain" in desc_lower or "violent" in desc_lower:
            return "waterlogged"
        elif (rain_mm and rain_mm > 0.0) or "rain" in desc_lower or "drizzle" in desc_lower or "shower" in desc_lower:
            return "wet"
        return "dry"

    @classmethod
    def _infer_traffic_density(cls, congestion_ratio: Optional[float], is_rush_hour: bool, is_night: bool) -> str:
        """Determines traffic density categorical classification."""
        if congestion_ratio is not None:
            if congestion_ratio >= 0.45:
                return "heavy"
            elif congestion_ratio >= 0.20:
                return "moderate"
            return "low"
        if is_rush_hour:
            return "heavy"
        if is_night:
            return "low"
        return "moderate"

    @classmethod
    async def evaluate_location_risk(
        cls,
        location: Location,
        force_refresh: bool = False,
    ) -> RiskAssessmentResponse:
        """Computes comprehensive risk score and severity prediction for a location."""
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        hour = now.hour
        day_of_week = now.weekday()
        is_weekend = int(day_of_week in (5, 6))
        is_night = int(hour >= 22 or hour <= 5)
        is_rush_hour = int((8 <= hour <= 11) or (17 <= hour <= 21))

        # 1. Fetch live telemetry concurrently
        weather = await OpenMeteoWeatherService.fetch_weather_for_location(location, force_refresh=force_refresh)
        flow = await TomTomTrafficService.fetch_traffic_flow(location, force_refresh=force_refresh)

        # 2. Extract standardized attributes
        road_type, speed_limit = cls._extract_road_attributes(location)
        rain_val = weather.rain_mm if weather.rain_mm is not None else weather.precipitation_mm
        surface_condition = cls._infer_surface_condition(weather.weather_description, rain_val)
        traffic_density = cls._infer_traffic_density(flow.congestion_ratio, bool(is_rush_hour), bool(is_night))

        # Map weather condition for model input
        weather_text = weather.weather_description.lower()
        if "rain" in weather_text or "drizzle" in weather_text:
            model_weather = "rain"
        elif "fog" in weather_text or "mist" in weather_text:
            model_weather = "fog"
        elif "cloud" in weather_text or "overcast" in weather_text:
            model_weather = "overcast"
        else:
            model_weather = "clear"

        # 3. Model Inference or Heuristic Severity Probability
        model = cls.load_model()
        model_status = "ml_model_active"

        if model is not None:
            try:
                features_df = pd.DataFrame(
                    [
                        {
                            "hour_of_day": hour,
                            "day_of_week": day_of_week,
                            "is_weekend": is_weekend,
                            "is_night": is_night,
                            "is_rush_hour": is_rush_hour,
                            "speed_limit_kmh": speed_limit,
                            "road_type": road_type,
                            "weather_condition": model_weather,
                            "surface_condition": surface_condition,
                            "traffic_density": traffic_density,
                        }
                    ]
                )
                proba = model.predict_proba(features_df)
                severity_prob = round(float(proba[0][1]), 4)
            except Exception as exc:
                logger.error("ML model inference failed for '%s': %s", location.id, str(exc))
                severity_prob = 0.25
                model_status = "heuristic_baseline"
        else:
            # Explainable heuristic baseline if model file is not present
            severity_prob = 0.20
            if is_night:
                severity_prob += 0.12
            if surface_condition in ("wet", "waterlogged"):
                severity_prob += 0.10
            if speed_limit >= 80:
                severity_prob += 0.08
            severity_prob = round(min(0.85, severity_prob), 4)
            model_status = "heuristic_baseline"

        predicted_class = "Severe/Fatal" if severity_prob >= 0.40 else "Minor"

        # 4. Multi-factor Risk Score Calculation (0.0 to 100.0)
        # Factor A: Congestion / Speed Deficit
        if flow.congestion_ratio is not None:
            congestion_factor = round(min(1.0, max(0.0, flow.congestion_ratio * 1.3)), 3)
        else:
            congestion_factor = 0.25  # Neutral default when flow API unconfigured

        # Factor B: Weather Hazard
        if surface_condition == "waterlogged":
            weather_factor = 0.85
        elif surface_condition == "wet":
            weather_factor = 0.55
        elif model_weather == "fog":
            weather_factor = 0.50
        else:
            weather_factor = 0.15

        # Factor C: Temporal Risk
        if is_night:
            temporal_factor = 0.70
        elif is_rush_hour:
            temporal_factor = 0.65
        else:
            temporal_factor = 0.25

        # Factor D: Road Geometry
        if road_type == "flyover":
            road_factor = 0.60
        elif road_type == "junction":
            road_factor = 0.50
        else:
            road_factor = 0.30

        # Composite statistical risk formula (0 - 100)
        raw_score = (
            (severity_prob * 35.0)
            + (congestion_factor * 25.0)
            + (weather_factor * 25.0)
            + (temporal_factor * 15.0)
        )
        risk_score = round(max(5.0, min(95.0, raw_score)), 1)

        # Categorical Tier
        if risk_score >= 70.0:
            risk_level = "CRITICAL"
        elif risk_score >= 50.0:
            risk_level = "HIGH"
        elif risk_score >= 30.0:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return RiskAssessmentResponse(
            location_id=location.id,
            location_name=location.name,
            timestamp=now_iso,
            risk_score=risk_score,
            risk_level=risk_level,
            predicted_severity_class=predicted_class,
            severity_probability=severity_prob,
            contributing_factors=RiskFactors(
                congestion_factor=congestion_factor,
                weather_factor=weather_factor,
                temporal_factor=temporal_factor,
                road_geometry_factor=road_factor,
            ),
            observed_inputs=ObservedTelemetryInputs(
                current_speed_kmh=flow.current_speed_kmh,
                free_flow_speed_kmh=flow.free_flow_speed_kmh,
                congestion_ratio=flow.congestion_ratio,
                weather_description=weather.weather_description,
                rain_mm=rain_val,
                road_type=road_type,
                hour_of_day=hour,
                is_night=bool(is_night),
                is_rush_hour=bool(is_rush_hour),
            ),
            model_status=model_status,
            model_version="v1.0-randomforest-severity",
        )
