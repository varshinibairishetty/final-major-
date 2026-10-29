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

### Phase 4: Provisional Risk Scoring & Historical ML Model
- [ ] Define standardized risk models in `backend/app/schemas/`:
  - `RiskScore`: numerical score (0-100), categorical label (LOW, MODERATE, HIGH, CRITICAL), and factor breakdown.
- [ ] Build the provisional heuristic risk estimation engine:
  - Congestion factor: $1 - (\text{speed} / \text{free\_flow\_speed})$.
  - Weather hazard factors: rain multiplier, visibility penalties.
  - Temporal factors: peak office rush vs. off-peak vs. night.
- [ ] Ingest historical Hyderabad accident records into `data/historical/`.
- [ ] Train and evaluate supervised ML model (e.g. scikit-learn / XGBoost) and integrate model inference with heuristic fallback.

---

### Phase 5: End-to-End Testing, Hardening and Deployment Preparation
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
