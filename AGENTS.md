# Agent Guidelines: Smart Traffic Management & Accident Prediction System

This document outlines core principles, architectural boundaries, and operational constraints for AI agents and developers working on this codebase.

---

## 1. Project Objective & Workflow

The goal of this project is to build an intelligent, live-monitoring traffic safety platform focusing on selected corridors and junctions in **Hyderabad, India**.

### Primary Operational Paradigm
- **API-Driven Architecture:** The system ingests live traffic metrics (flow, speed, travel times) and weather conditions via external REST APIs (e.g., TomTom and Open-Meteo).
- **No Video Upload Dependency:** Manually uploaded traffic videos must **not** be the primary data source or core application workflow. Do not architect features around ad-hoc video file uploads for traffic analysis unless explicitly scoped as an auxiliary experimental module.
- **Risk Estimation Progression:** Accident risk is estimated using an explicit, explainable heuristic baseline initially, followed by a properly trained and evaluated Machine Learning model (e.g., scikit-learn, XGBoost) trained on historical accident, weather, and traffic features.

---

## 2. Core Development Rules

### Rule 1: Small, Incremental, Tested Changes
- Execute development in small, logically bounded steps.
- Do not make sweeping, unverified changes across multiple layers simultaneously.
- Verify each step with automated tests or concrete validation before moving to the next.

### Rule 2: Strict Separation of Concerns
- **Backend (`backend/`):**
  - Handles all external API communication (TomTom, Open-Meteo).
  - Normalizes external data models into unified domain schemas.
  - Implements caching, timeout resilience, error handling, and risk calculation algorithms.
  - Serves sanitized, typed REST endpoints for the frontend.
- **Frontend (`frontend/`):**
  - Pure presentation and user interaction layer.
  - Renders geospatial data on Leaflet maps, displays location cards, incident feeds, and risk gauges.
  - Never communicates directly with third-party APIs (TomTom, Open-Meteo) to ensure API key security and data consistency.

### Rule 3: Never Fabricate Live Data
- **Zero Hallucination of Data:** Never mock or simulate fake live traffic numbers, weather data, or incident alerts disguised as real API data.
- **Explicit Fallbacks:** When API keys are unavailable, quotas are exceeded, or networks fail, the system must clearly return an explicit degraded/offline state or structured fallback notification with appropriate HTTP status codes and metadata indicators (`is_simulated: false`, `data_source: "error_fallback"`).

### Rule 4: Clear Conceptual Distinctions
Always maintain crisp domain separation between the following three concepts:
1. **Reported Incidents:** Verified external events reported by provider APIs (e.g., verified accidents, road closures, construction zones).
2. **Congestion Metrics:** Observed traffic dynamics (e.g., current speed vs. free-flow speed, delay seconds, congestion ratio).
3. **Predicted Accident Risk:** Statistical or model-derived probability/severity score of an accident occurring at a given location and time window, influenced by congestion, weather conditions, road geometry, and temporal factors.

### Rule 5: Credential Security & Zero Leakage
- All API keys, tokens, and backend configuration secrets must reside in backend environment variables (`.env`).
- Never expose API credentials in frontend bundles, Vite config, query params, or client-side storage.
- Never hardcode or commit keys into repository files.

### Rule 6: Documentation Integrity
- Whenever an architectural change, new endpoint, data model adjustment, or dependency change occurs, update `README.md`, `docs/architecture.md`, and relevant Architecture Decision Records (ADRs).
- Ensure documentation accurately reflects the current phase without claiming incomplete features exist.
