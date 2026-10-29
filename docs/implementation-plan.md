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

### Phase 0: Repository Setup and Configuration (Current)
- [x] Create project directory layout across `backend/`, `frontend/`, `docs/`, and `data/`.
- [x] Configure `.gitignore` to prevent secret leakage and untracked binary/cache bloat.
- [x] Set up `.env.example` templates with clear variable descriptions.
- [x] Formulate `AGENTS.md` specifying data authenticity, separation of concerns, and security constraints.
- [x] Write baseline `README.md`, architectural documentation (`docs/architecture.md`), and Architecture Decision Record (`ADR-001`).
- [x] Initialize Git repository.

---

### Phase 1: Live Traffic and Weather Integration
- [ ] Configure Python virtual environment and install backend core dependencies (`fastapi`, `uvicorn`, `httpx`, `pydantic-settings`).
- [ ] Implement `backend/app/core/config.py` using Pydantic Settings to load and validate environment variables.
- [ ] Build curated Hyderabad location definitions file (`data/locations/hyderabad_hotspots.json`) covering 6-10 major traffic corridors.
- [ ] Implement `TomTomClient` service:
  - Query Traffic Flow Segment API (current speed, free-flow speed).
  - Query Traffic Incidents Details API (active incidents within bounding boxes).
  - Add timeout management (5s), retry handling, and error response formatting.
- [ ] Implement `OpenMeteoClient` service:
  - Query current weather metrics (rain, showers, precipitation, visibility).
- [ ] Write isolated unit tests for API clients with mocked HTTP payloads.

---

### Phase 2: Backend Endpoints, Data Normalization & Provisional Risk Engine
- [ ] Define standardized Pydantic domain models in `backend/app/schemas/`:
  - `TrafficMetrics`: speed, free-flow speed, delay, congestion index.
  - `Incident`: category, severity, description, coordinates, delay impact.
  - `WeatherMetrics`: rain intensity, visibility, road surface hazard condition.
  - `LocationRiskResponse`: aggregated metrics, risk score, risk level, data freshness timestamp.
- [ ] Build the provisional heuristic risk estimation engine:
  - Calculate congestion index: $1 - (\text{speed} / \text{free\_flow\_speed})$.
  - Factor in weather hazard level (rain multiplier, low visibility penalties).
  - Factor in time-of-day risk (peak office rush vs. off-peak vs. night).
  - Output normalized risk score ($0.0 - 100.0$) and categorical label (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
- [ ] Expose REST endpoints in `backend/app/api/routes/`:
  - `GET /api/v1/locations`: List all monitored Hyderabad locations.
  - `GET /api/v1/locations/{id}/traffic`: Latest traffic flow and incidents.
  - `GET /api/v1/locations/{id}/weather`: Current weather conditions.
  - `GET /api/v1/locations/{id}/risk`: Integrated accident risk score with breakdown.
  - `GET /api/v1/dashboard/summary`: Aggregated overview for all locations.
- [ ] Write integration tests for API endpoints.

---

### Phase 3: Frontend Dashboard and Interactive Map
- [ ] Initialize Node.js dependencies (`react`, `react-dom`, `leaflet`, `react-leaflet`, `tailwindcss`, `lucide-react`).
- [ ] Configure Leaflet map view centered on Hyderabad coordinates (`17.3850° N, 78.4867° E`).
- [ ] Create API service layer in `frontend/src/services/` with typed responses corresponding to backend schemas.
- [ ] Build dashboard UI components:
  - **Map Component:** Interactive markers representing monitored locations, color-coded by real-time risk level.
  - **Incident Markers / Overlays:** Highlighting verified provider incidents.
  - **Location Detail Drawer / Card:** Showing current vs. free-flow speeds, congestion ratio, weather severity, and risk breakdown.
  - **Incident Feed / Alert List:** Chronological feed of active road hazards.
  - **Data Freshness Indicator:** Displaying when data was fetched and warning if backend returns cached or degraded results.
- [ ] Build responsive layout and error banners for network interruptions.

---

### Phase 4: Historical Accident Data and Machine Learning Evaluation
- [ ] Curate and organize historical accident datasets for Hyderabad/Telangana in `data/historical/`.
- [ ] Implement data extraction and preprocessing pipelines using `pandas`.
- [ ] Perform feature engineering:
  - Temporal features: hour of day, day of week, seasonal monsoon flag.
  - Congestion features: speed differential, delay ratio.
  - Weather features: precipitation volume, visibility threshold.
  - Roadway features: intersection type, flyover presence.
- [ ] Train and evaluate baseline and advanced ML models (e.g., Logistic Regression, Random Forest, XGBoost).
- [ ] Evaluate metrics: ROC-AUC, precision, recall, F1-score, and confusion matrix.
- [ ] Save trained model pipeline and artifacts; implement model inference service in `backend/app/services/risk_engine.py` with seamless fallback to heuristic baseline if model weights are unavailable.

---

### Phase 5: Testing, Hardening, Documentation and Deployment Preparation
- [ ] Backend test suite: Unit tests for services, schemas, and routes using `pytest` and `pytest-asyncio`.
- [ ] Frontend test suite: Component rendering and state verification using `vitest` and React Testing Library.
- [ ] Performance and timeout stress testing under network degradation scenarios.
- [ ] Complete user documentation, API documentation (FastAPI Swagger/ReDoc), and operational deployment guidelines.
- [ ] Final architecture review and handoff.
