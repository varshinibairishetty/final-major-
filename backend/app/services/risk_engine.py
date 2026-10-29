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
from app.schemas.traffic import TrafficFlowData
from app.schemas.weather import WeatherData
from app.services.tomtom_service import TomTomTrafficService
from app.services.video_service import VideoAnalyticsService
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

        logger.warning("No pre-trained model artifact found. Risk engine will signal unavailable status.")
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
        weather: Optional[WeatherData] = None,
        flow: Optional[TrafficFlowData] = None,
        video_job_id: Optional[str] = None,
        force_refresh: bool = False,
    ) -> RiskAssessmentResponse:
        """Computes comprehensive risk score and severity prediction for a location.

        Synthesizes empirical Open-Meteo weather, TomTom traffic flow, and the trained
        RandomForest classifier. If inputs are missing or model is unavailable, returns
        an explicit typed unavailable state without inventing data.
        """
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        hour = now.hour
        day_of_week = now.weekday()
        is_weekend = int(day_of_week in (5, 6))
        is_night = int(hour >= 22 or hour <= 5)
        is_rush_hour = int((8 <= hour <= 11) or (17 <= hour <= 21))

        # 1. Roadway geometry and reference limits
        road_type, speed_limit = cls._extract_road_attributes(location)

        # 2. Fetch live telemetry if not supplied
        if weather is None:
            weather = await OpenMeteoWeatherService.fetch_weather_for_location(
                location, force_refresh=force_refresh
            )
        if flow is None:
            flow = await TomTomTrafficService.fetch_traffic_flow(
                location, force_refresh=force_refresh
            )

        # 3. Handle model availability
        model = cls.load_model()
        if model is None:
            logger.warning("Risk assessment unavailable: No trained ML model artifact found for '%s'", location.id)
            return RiskAssessmentResponse(
                location_id=location.id,
                location_name=location.name,
                timestamp=now_iso,
                risk_score=None,
                risk_level="UNAVAILABLE",
                predicted_severity_class=None,
                severity_probability=None,
                contributing_factors=None,
                observed_inputs=ObservedTelemetryInputs(
                    current_speed_kmh=flow.current_speed_kmh if flow else None,
                    free_flow_speed_kmh=flow.free_flow_speed_kmh if flow else None,
                    congestion_ratio=flow.congestion_ratio if flow else None,
                    weather_description=weather.weather_description if weather else "Unknown",
                    rain_mm=weather.rain_mm if weather else None,
                    road_type=road_type,
                    hour_of_day=hour,
                    is_night=bool(is_night),
                    is_rush_hour=bool(is_rush_hour),
                ),
                model_status="model_unavailable",
                model_version="unavailable",
                status="unavailable",
                error_message="Trained accident risk model artifact is unavailable. Risk scores are not fabricated.",
                limitations_note="Risk prediction unavailable: Valid ML model artifact not found on disk.",
            )

        # 4. Handle weather telemetry availability
        if weather.status != "success":
            logger.warning("Risk assessment unavailable: Weather telemetry degraded/unavailable for '%s'", location.id)
            return RiskAssessmentResponse(
                location_id=location.id,
                location_name=location.name,
                timestamp=now_iso,
                risk_score=None,
                risk_level="UNAVAILABLE",
                predicted_severity_class=None,
                severity_probability=None,
                contributing_factors=None,
                observed_inputs=ObservedTelemetryInputs(
                    current_speed_kmh=flow.current_speed_kmh if flow else None,
                    free_flow_speed_kmh=flow.free_flow_speed_kmh if flow else None,
                    congestion_ratio=flow.congestion_ratio if flow else None,
                    weather_description="Weather telemetry unavailable",
                    rain_mm=None,
                    road_type=road_type,
                    hour_of_day=hour,
                    is_night=bool(is_night),
                    is_rush_hour=bool(is_rush_hour),
                ),
                model_status="telemetry_unavailable",
                model_version="v1.0-randomforest-severity",
                status="unavailable",
                error_message="Live weather telemetry is unavailable. Predictions require verified empirical conditions.",
                limitations_note="Risk estimation suspended: live environmental telemetry from Open-Meteo is unavailable.",
            )

        # 5. Extract empirical telemetry attributes
        rain_val = weather.rain_mm if weather.rain_mm is not None else weather.precipitation_mm
        surface_condition = cls._infer_surface_condition(weather.weather_description, rain_val)

        weather_text = weather.weather_description.lower()
        if "rain" in weather_text or "drizzle" in weather_text or "shower" in weather_text:
            model_weather = "rain"
        elif "fog" in weather_text or "mist" in weather_text or "haze" in weather_text:
            model_weather = "fog"
        elif "cloud" in weather_text or "overcast" in weather_text:
            model_weather = "overcast"
        else:
            model_weather = "clear"

        # Check traffic flow availability
        has_live_flow = flow.status == "success" and flow.congestion_ratio is not None
        if has_live_flow:
            traffic_density = cls._infer_traffic_density(flow.congestion_ratio, bool(is_rush_hour), bool(is_night))
            congestion_factor = round(min(1.0, max(0.0, flow.congestion_ratio * 1.3)), 3)
        else:
            traffic_density = "unknown"
            congestion_factor = 0.0

        # 6. Execute ML Model Inference
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
            model_status = "ml_model_active" if has_live_flow else "hybrid_heuristic (traffic unconfigured)"
        except Exception as exc:
            logger.error("ML model inference failed for '%s': %s", location.id, str(exc))
            return RiskAssessmentResponse(
                location_id=location.id,
                location_name=location.name,
                timestamp=now_iso,
                risk_score=None,
                risk_level="UNAVAILABLE",
                predicted_severity_class=None,
                severity_probability=None,
                contributing_factors=None,
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
                model_status="inference_error",
                model_version="v1.0-randomforest-severity",
                status="unavailable",
                error_message=f"Model inference error: {str(exc)}",
                limitations_note="Model inference failed on feature vector.",
            )

        predicted_class = "Severe/Fatal" if severity_prob >= 0.40 else "Minor"

        # 7. Contributing Factor Weight Calculation
        # Factor A: Weather Hazard
        if surface_condition == "waterlogged":
            weather_factor = 0.85
        elif surface_condition == "wet":
            weather_factor = 0.55
        elif model_weather == "fog":
            weather_factor = 0.50
        else:
            weather_factor = 0.15

        # Factor B: Temporal Risk
        if is_night:
            temporal_factor = 0.70
        elif is_rush_hour:
            temporal_factor = 0.65
        else:
            temporal_factor = 0.25

        # Factor C: Road Geometry
        if road_type == "flyover":
            road_factor = 0.60
        elif road_type == "junction":
            road_factor = 0.50
        else:
            road_factor = 0.30

        # Composite statistical risk formula (0 - 100)
        if has_live_flow:
            raw_score = (
                (severity_prob * 35.0)
                + (congestion_factor * 25.0)
                + (weather_factor * 25.0)
                + (temporal_factor * 15.0)
            )
            limitations_note = (
                "Composite risk index synthesized from live TomTom traffic flow, Open-Meteo weather, "
                "temporal factors, and benchmark ML severity model (RandomForest, ROC-AUC: 0.566). Never represents a confirmed accident."
            )
        else:
            raw_score = (
                (severity_prob * 45.0)
                + (weather_factor * 35.0)
                + (temporal_factor * 20.0)
            )
            limitations_note = (
                "Heuristic composite risk index calculated from live Open-Meteo weather, temporal dynamics, and benchmark ML severity propensity. "
                "TomTom traffic flow is currently unconfigured (0% weight). Never represents a confirmed accident."
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

        # Video Analytics integration
        video_analytics_data = None
        video_avail = "missing"
        v_job_id = None
        v_flow_rate = None
        v_density = None
        v_vehicles = None

        if video_job_id:
            job = VideoAnalyticsService.get_job(video_job_id)
            if job:
                if job.location_id == location.id:
                    video_avail = "available" if job.status == "completed" else job.status
                    video_analytics_data = {
                        "job_id": job.job_id,
                        "filename": job.filename,
                        "status": job.status,
                        "total_unique_vehicles": job.counts.total_unique,
                        "vehicle_counts": job.counts.model_dump(),
                        "flow_rate_per_min": job.vehicle_flow_rate_per_min,
                        "density_estimate": job.density_estimate,
                        "peak_concurrent_vehicles": job.peak_concurrent_vehicles,
                        "video_duration_sec": job.video_duration_sec,
                    }
                    v_job_id = job.job_id
                    v_flow_rate = job.vehicle_flow_rate_per_min
                    v_density = job.density_estimate
                    v_vehicles = job.counts.total_unique
                else:
                    video_avail = "location_mismatch"
                    video_analytics_data = {
                        "error": f"Video belongs to '{job.location_name}' ({job.location_id}), not '{location.name}'. Excluded from evaluation."
                    }

        input_availability = {
            "video_analytics": video_avail,
            "weather_telemetry": "available" if weather.status == "success" else weather.status,
            "live_traffic_flow": "available" if has_live_flow else "unconfigured",
            "historical_benchmark": "available",
        }

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
                video_job_id=v_job_id,
                video_flow_rate_per_min=v_flow_rate,
                video_density_estimate=v_density,
                video_unique_vehicles=v_vehicles,
            ),
            input_availability=input_availability,
            video_analytics=video_analytics_data,
            model_status=model_status,
            model_version="v1.0-randomforest-severity",
            status="success",
            limitations_note=limitations_note,
        )
