# Multimodal AI-Based Smart Traffic Management and Accident Prediction System

An intelligent traffic safety and risk estimation platform designed to monitor selected traffic corridors and intersections in **Hyderabad, India**. By synthesizing real-time traffic flow data, provider-reported road incidents, atmospheric weather conditions, and historical accident records, the system computes location-specific accident risk levels and surfaces actionable insights through an interactive dashboard.

---

## 1. Project Overview

Urban corridors in major metropolitan hubs like Hyderabad face fluctuating congestion, severe weather impacts (such as waterlogging during monsoon showers), and localized accident bottlenecks. 

This platform addresses road safety proactively:
- Ingests real-time traffic flow (speeds, delays) and reported road incidents from traffic services (e.g., TomTom APIs).
- Ingests hyper-local atmospheric weather data (precipitation, visibility, rain) via Open-Meteo.
- Correlates live factors with historical accident trends to compute real-time accident risk scores across monitored Hyderabad hotspots.
- Presents clear geospatial risk heatmaps, incident feeds, and data freshness metrics on a responsive dashboard.

> **Architecture Philosophy:** The platform relies strictly on verified REST API telemetry and structured geospatial coordinates—not on ad-hoc uploaded video files or manual video feeds.

---

## 2. Planned Features

- **Hyderabad Hotspot Registry:** Configurable metadata for key Hyderabad traffic junctions and corridors (e.g., Gachibowli, HITEC City, Punjagutta, Mehdipatnam, Secunderabad, LB Nagar).
- **Live Traffic Flow & Speed Monitoring:** Real-time ingestion of current speed, free-flow speed, and congestion indices via TomTom Traffic Flow API.
- **Provider-Reported Incidents Feed:** Ingestion of road closures, roadworks, and verified road hazards via TomTom Incidents API.
- **Atmospheric Weather Telemetry:** Real-time weather observation (precipitation, rain intensity, fog/visibility) via Open-Meteo API.
- **Unified Risk Estimation Engine:**
  - *Provisional Baseline:* Heuristic risk scoring combining speed deficits, weather severity factors, and peak-hour multipliers.
  - *Advanced ML Model:* Supervised classification/regression model (e.g., XGBoost / Random Forest) trained on historical accident records and environmental features.
- **Interactive React Dashboard:**
  - Dynamic Leaflet-based geospatial map with risk color-coding (Low, Moderate, High, Severe).
  - Detailed location drill-down cards with speed delta and weather telemetry.
  - Incident timeline and alert notices.
  - Telemetry freshness indicators showing timestamp of last API fetch.

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 18+, TypeScript, Vite, Tailwind CSS, Leaflet / React-Leaflet | Fast, reactive dashboard, geospatial visualization, and incident display |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2, HTTPX | High-performance asynchronous API, data normalization, and risk estimation |
| **Data & ML** | Pandas, scikit-learn, XGBoost | Data preprocessing, feature engineering, and accident risk model inference |
| **External APIs** | TomTom Traffic Flow & Incidents APIs, Open-Meteo Weather API | Real-time traffic dynamics, incident data, and atmospheric observations |
| **Tooling & VCS** | Git, Pytest, Vitest | Version control, backend unit/integration testing, frontend testing |

---

## 4. Repository Structure

```text
smart-traffic-ai/
├── AGENTS.md                  # Development constraints and principles for AI and contributors
├── README.md                  # Primary project documentation and onboarding guide
├── .gitignore                 # Version control exclusions
├── .env.example               # Root template for environment configuration
├── docs/                      # Architectural designs, plans, and decision records
│   ├── architecture.md        # Detailed end-to-end dataflow and layer responsibilities
│   ├── implementation-plan.md # Phased roadmap for development
│   └── decisions/             # Architecture Decision Records (ADRs)
│       └── ADR-001-initial-architecture.md
├── backend/                   # Python FastAPI service
│   ├── app/
│   │   ├── api/routes/        # REST endpoint routes (traffic, weather, risk, locations)
│   │   ├── core/              # Global application configuration and settings
│   │   ├── models/            # Domain entities and database/ORM models (if needed)
│   │   ├── schemas/           # Pydantic validation and serialization schemas
│   │   └── services/          # External API clients (TomTom, Open-Meteo) and risk logic
│   ├── tests/                 # Backend automated unit and integration tests
│   ├── requirements.txt       # Python package dependencies
│   ├── .env.example           # Backend-specific environment template
│   └── README.md              # Backend setup and execution guidelines
├── frontend/                  # React + TypeScript + Vite web application
│   ├── src/
│   │   ├── components/        # Reusable UI components (Map, RiskCard, IncidentList)
│   │   ├── pages/             # Top-level view layouts (Dashboard)
│   │   ├── services/          # API client calling backend endpoints
│   │   ├── types/             # TypeScript interfaces and data contracts
│   │   ├── hooks/             # Custom React state and data hooks
│   │   ├── App.tsx            # Main application wrapper
│   │   └── main.tsx           # React entry point
│   ├── public/                # Static assets and icons
│   ├── tests/                 # Frontend tests
│   ├── package.json           # Node.js project manifest and scripts
│   ├── tsconfig.json          # TypeScript compiler configuration
│   ├── vite.config.ts         # Vite bundler configuration
│   └── README.md              # Frontend setup and execution guidelines
└── data/                      # Geospatial and historical datasets
    ├── locations/             # Hyderabad monitored junctions and corridor definitions
    └── historical/            # Historical accident and traffic datasets for ML evaluation
```

---

## 5. Prerequisites & Setup Overview

### System Prerequisites
- **Python**: Version `3.10` or higher
- **Node.js**: Version `18.x` or higher (LTS recommended)
- **Git**: Installed and configured on your system
- **TomTom Developer Account**: API Key for Traffic Flow and Incident APIs ([TomTom Developer Portal](https://developer.tomtom.com/))

### Environment Configuration
1. Copy `.env.example` in the backend directory to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Populate the `.env` file with your TomTom API key:
   ```env
   TOMTOM_API_KEY=your_actual_tomtom_api_key
   ```
3. Open-Meteo does not require an API key for standard non-commercial usage.

---

## 6. Planned Development Phases

- [x] **Phase 0: Repository Setup & Foundational Architecture**
  - Establish directory structure, baseline documentation, ADRs, security boundaries, and project guidelines.
- [x] **Phase 1: Environment Setup and Minimal Working Backend**
  - Configure Python virtual environment (`.venv`), install core dependencies, implement `Settings` config with secret safety, authoritative Hyderabad location registry (`data/locations/hyderabad_hotspots.json`), `GET /`, `GET /api/v1/health`, `GET /api/v1/locations` endpoints, and automated tests.
- [x] **Phase 2: Live Traffic & Weather Integration (TomTom & Open-Meteo) (Current)**
  - Implement external HTTP API clients for Open-Meteo current weather and TomTom Traffic Flow & Incidents with timeout resilience (5s), in-memory TTL caching, geographic incident matching (Haversine 3km), distinct accident categorization, concurrency via `asyncio.gather`, and endpoints (`/weather`, `/traffic`, `/incidents`, `/traffic-overview`).
- [ ] **Phase 3: Normalization, Incident Processing & Provisional Risk Engine**
  - Synthesize external telemetry into unified risk schemas, calculate congestion metrics, and build heuristic risk scoring.
- [ ] **Phase 4: Frontend Dashboard & Geospatial Visualization**
  - Develop React + Leaflet map view, live risk badges, incident timeline, and freshness indicators.
- [ ] **Phase 5: Historical Accident Data & ML Risk Model**
  - Ingest historical accident data, perform feature engineering, train ML models (scikit-learn / XGBoost), and compare with heuristic baseline.
- [ ] **Phase 6: End-to-End Validation, Testing & Hardening**
  - Comprehensive automated tests, error resilience, fallback handling, and deployment readiness.

---

## 7. Current Implementation Status

> **Status as of Phase 2:**
> - Full live traffic and weather API integration is active.
> - Open-Meteo weather service fetches real-time atmospheric measurements.
> - TomTom traffic flow service retrieves real-time speed, free-flow speed, travel times, and congestion ratios.
> - TomTom incidents service fetches provider-reported road hazards within 3km of each junction, strictly distinguishing accidents from general congestion.
> - In-memory TTL caching ensures API quota efficiency.
> - City-wide `/api/v1/traffic-overview` concurrently queries all monitored locations.
> - Automated test suite with 20 offline unit and integration tests passing at 100%.
