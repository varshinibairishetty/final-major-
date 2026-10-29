# Phased Implementation Plan

This roadmap outlines the structured, step-by-step development process for the **Multimodal AI-Based Smart Traffic Management and Accident Prediction System**.

---

## Phase Overview

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
  Setup       Ingestion   Normalized    Frontend    Historical    Testing &
& Config      APIs       & Heuristic   Dashboard      & ML       Hardening
```

---

## Detailed Phase Breakdown

### Phase 0: Repository Setup and Configuration
- [x] Create project directory layout across `backend/`, `frontend/`, `docs/`, and `data/`.
- [x] Configure `.gitignore` to prevent secret leakage and untracked binary/cache bloat.
- [x] Set up `.env.example` templates with clear variable descriptions.
- [x] Formulate `AGENTS.md` specifying data authenticity, separation of concerns, and security constraints.
- [x] Write baseline `README.md`, architectural documentation (`docs/architecture.md`), and Architecture Decision Record (`ADR-001`).
- [x] Initialize Git repository.

---

### Phase 1: Environment Setup and Minimal Working Backend (Current)
- [x] Configure Python virtual environment (`backend/.venv`) and install minimal dependencies (`fastapi`, `uvicorn`, `httpx`, `pydantic-settings`, `pytest`).
- [x] Implement `backend/app/core/config.py` loading environment settings with secret protection.
- [x] Build authoritative Hyderabad location configuration in `data/locations/hyderabad_hotspots.json` with 5 example monitoring points (Gachibowli, Hitech City, Madhapur, Kukatpally, Jubilee Hills).
- [x] Implement `GET /` metadata endpoint and `GET /api/v1/health` health check.
- [x] Implement `GET /api/v1/locations` to return configured locations with approximate coordinates and disclaimer.
- [x] Write and pass automated test suite in `backend/tests/test_api.py`.

---

### Phase 2: Live Traffic and Weather Integration (TomTom & Open-Meteo) (Current)
- [x] Implement `OpenMeteoWeatherService`:
  - Query current weather metrics (temperature, relative humidity, precipitation, rain, weather code, wind speed).
  - Map WMO weather codes to human-readable condition summaries.
  - Integrate in-memory TTL caching (15 min) and timeout management (5s).
- [x] Implement `TomTomTrafficService`:
  - Query Traffic Flow Segment API (current speed, free-flow speed, travel times, congestion ratio).
  - Query Traffic Incidents Details API (active incidents within bounding boxes).
  - Implement Haversine distance geographic matching (3km radius) and incident deduplication.
  - Strictly distinguish provider-verified accidents from general traffic jams/congestion.
  - Return clear unconfigured state when `TOMTOM_API_KEY` is missing without failing application startup.
  - Add timeout management (5s) and error response formatting without data fabrication.
- [x] Expose REST endpoints under `/api/v1`:
  - `GET /api/v1/locations/{id}/weather`
  - `GET /api/v1/locations/{id}/traffic`
  - `GET /api/v1/locations/{id}/incidents`
  - `GET /api/v1/traffic-overview` (concurrent multi-location aggregation via `asyncio.gather`).
- [x] Write and pass 20 automated tests with mock HTTP responses covering success, timeout, errors, and unconfigured credentials.

---

### Phase 3: Frontend Dashboard and Interactive Map (Current)
- [x] Initialize Node.js dependencies (`react`, `react-dom`, `leaflet`, `react-leaflet`, `lucide-react`, `typescript`, `vite`).
- [x] Configure Leaflet interactive map centered on Hyderabad coordinates (`17.445° N, 78.385° E`) with custom status pins.
- [x] Create API service layer in `frontend/src/services/api.ts` with typed responses matching backend schemas.
- [x] Add `frontend/.env.example` with local backend base URL template.
- [x] Build dashboard UI components:
  - **Header:** Project title, Hyderabad label, connection status for FastAPI, Open-Meteo, and TomTom, plus refresh button.
  - **SummaryCards:** Monitored locations count, live traffic availability, reported road incidents, and attention-required count.
  - **MapView:** Interactive Leaflet map with OpenStreetMap tiles, custom speed-coded markers, popups, and tile fallback.
  - **LocationCard:** Individual cards with speed, weather, incidents, congestion meters, and Phase 4 risk notices.
  - **LocationDetailModal:** Tabbed deep-dive modal for traffic flow, provider incidents, and atmospheric weather.
- [x] Full production build verified with zero TypeScript compiler errors.

---

### Phase 4: Historical Accident Data & Accident-Risk Prediction Pipeline (Current)
- [x] Curate benchmark historical accident dataset in `data/historical/raw/sample_accidents_raw.csv` (850 records).
- [x] Implement reproducible preprocessing pipeline in `scripts/data_prep.py` with data quality report and zero post-crash leakage.
- [x] Formulate severity classification target (`is_severe_accident`: 0=Slight/Minor, 1=Serious/Fatal) under class imbalance (~25% severe cases).
- [x] Train baseline scikit-learn model (`RandomForestClassifier` with balanced class weights) using time-based 80/20 train/test split.
- [x] Evaluate and log test metrics: Accuracy (0.606), ROC-AUC (0.566), F1-macro (0.362), and confusion matrix in `data/historical/processed/model_metrics.json`.
- [x] Implement backend inference service (`backend/app/services/risk_engine.py`) and endpoint (`GET /api/v1/locations/{id}/risk`).
- [x] Implement graceful fallback to explainable heuristic baseline if model artifacts are absent.
- [x] Integrate live AI risk model breakdown into the frontend drill-down modal.
- [x] Add automated unit tests in `backend/tests/test_risk.py` (25 total backend tests passing at 100%).

---

### Phase 5: Accident-Risk Prediction Dashboard Integration (Completed)
- [x] Integrate accident-risk prediction directly into the city-wide telemetry overview pipeline (`GET /api/v1/traffic-overview`).
- [x] Update composite location schema (`LocationOverview`) to carry typed, validated `RiskAssessmentResponse` for every monitored corridor.
- [x] Implement robust handling for missing, degraded, or unavailable provider inputs; enforce zero data fabrication.
- [x] Add honest unavailable states (`model_unavailable`, `telemetry_unavailable`) when model weights or live weather cannot be verified.
- [x] Enhance frontend dashboard components with full risk prediction integration:
  - **SummaryCards:** Dedicated risk index metric tracking elevated risk corridors versus total evaluated locations.
  - **LocationCard:** Color-coded risk tier badges (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`, `UNAVAILABLE`), index score, and severity propensity.
  - **MapView:** Marker popups with speed, congestion, weather, reported incidents, and predicted risk, plus clear spatial coverage disclaimers.
  - **LocationDetailModal:** Tabbed risk analysis with concept definitions, score breakdown, ML severity propensity, factor weights, and an audit table of observed pipeline inputs.
  - **Header:** Live AI Risk Model operational status indicator.
- [x] Clear conceptual separation in UI: “Reported incident” vs. “Traffic congestion” vs. “Predicted accident risk”.
- [x] Automated test suite expanded to 26 tests covering active prediction, unavailable models, weather failure degradation, and overview aggregation.
- [x] Verified clean frontend production compilation with zero TypeScript errors.

---

### Phase 6: End-to-End Verification & Bug Fixes (Completed)
- [x] Comprehensive end-to-end verification across all 10 core application workflows.
- [x] Fixed frontend typecheck/lint script by binding `npm run lint` to `tsc --noEmit`.
- [x] Added provider failure resilience test case (`test_traffic_overview_provider_failure_resilience`) bringing backend test suite to 27 passing tests (100% pass rate).
- [x] Verified live external weather query against Open-Meteo API returning genuine Hyderabad telemetry.
- [x] Verified offline Scikit-learn model loading and live inference (`Score: 28.6`, `LOW RISK`).
- [x] Confirmed zero secret leakage: `TOMTOM_API_KEY` is completely isolated in backend environment files and excluded from version control.

---

### Phase 7: GitHub Readiness, Deployment Planning & Presentation (Completed)
- [x] Enhanced root `README.md` with Mermaid architecture flowchart, detailed directory structure breakdown, implemented feature inventory, and screenshots walkthrough.
- [x] Created comprehensive operational and hosting assessment in `docs/deployment-plan.md` covering PaaS options (Render, Vercel, Railway), environment variable matrix, and free-tier throttling limits.
- [x] Developed step-by-step project demonstration plan emphasizing the core domain disambiguation: "Reported incident" vs. "Traffic congestion" vs. "Predicted accident risk".
- [x] Audited `.gitignore` to guarantee exclusion of virtual environments, `.env` files, build caches (`.pytest_cache/`, `frontend/dist/`), and raw datasets.
- [x] Preserved Git state without unprompted commits or remote pushes.
