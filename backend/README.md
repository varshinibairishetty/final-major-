# Smart Traffic AI - Backend Service

FastAPI-powered asynchronous backend service responsible for managing monitored locations, ingesting live traffic and weather data from external APIs (TomTom and Open-Meteo), calculating congestion indexes, computing accident risk estimations, and serving REST endpoints to the frontend dashboard.

---

## 1. Directory Structure

```text
backend/
├── .venv/                   # Python virtual environment
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entrypoint & CORS middleware
│   ├── api/                 # API routers and versioned endpoints
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py  # Aggregated v1 API router (/api/v1)
│   │       ├── health.py    # Health check endpoint (/api/v1/health)
│   │       ├── locations.py # Hyderabad locations endpoint (/api/v1/locations)
│   │       ├── traffic.py   # Traffic flow, incidents, and overview endpoints
│   │       ├── weather.py   # Open-Meteo weather endpoint
│   │       └── risk.py      # Multi-modal accident risk assessment endpoint
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Environment settings (safe representation, no leaked secrets)
│   ├── models/              # Trained ML model artifacts (model_baseline.joblib)
│   ├── schemas/             # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── location.py      # Location and LocationListResponse models
│   │   ├── traffic.py       # TrafficFlowData, TrafficIncident, Overview models
│   │   ├── weather.py       # WeatherData normalization models
│   │   └── risk.py          # RiskAssessmentResponse, RiskFactors, Telemetry inputs
│   └── services/            # Core business logic and external API integrations
│       ├── __init__.py
│       ├── cache.py         # Thread-safe in-memory TTL caching layer
│       ├── location_service.py # Authoritative location loader
│       ├── tomtom_service.py   # TomTom Flow & Incidents client
│       ├── weather_service.py  # Open-Meteo weather client
│       └── risk_engine.py      # Scikit-learn inference & multi-factor risk engine
├── tests/                   # Automated pytest suite
│   ├── __init__.py
│   ├── test_api.py          # Route tests (root, health, locations)
│   ├── test_traffic.py      # TomTom flow, incident matching, and overview tests
│   ├── test_weather.py      # Open-Meteo weather integration and caching tests
│   └── test_risk.py         # Risk prediction engine and ML fallback tests
├── .env.example             # Environment configuration template
├── requirements.txt         # Production and test dependencies
└── README.md                # Backend documentation
```

---

## 2. Setup & Execution

### 1. Python Environment Setup
The project uses a Python virtual environment located in `backend/.venv`.

**Activate on Windows (PowerShell):**
```powershell
# From the workspace root:
.\backend\.venv\Scripts\Activate.ps1

# Or if you are inside the backend directory:
.\.venv\Scripts\Activate.ps1
```

**Activate on Linux / macOS:**
```bash
source backend/.venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in the `backend/` folder:
```powershell
Copy-Item backend\.env.example backend\.env
```

To enable live TomTom traffic flow and incidents, obtain a developer key from [TomTom Developer Portal](https://developer.tomtom.com/) and populate:
```env
TOMTOM_API_KEY=your_actual_tomtom_api_key
```
*(Open-Meteo standard endpoints require no API key. If `TOMTOM_API_KEY` is omitted, the backend starts normally and gracefully returns status `unconfigured` for traffic endpoints without failing).*

### 4. Run the Development Server
**From the repository root:**
```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
```

**From inside `backend/`:**
```powershell
cd backend
..\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 3. Available Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `GET /` | `GET` | Service root and active phase metadata |
| `GET /api/v1/health` | `GET` | Uptime and service health check |
| `GET /api/v1/locations` | `GET` | Configured Hyderabad monitoring locations list |
| `GET /api/v1/locations/{id}` | `GET` | Single location metadata and coordinates |
| `GET /api/v1/locations/{id}/weather` | `GET` | Real-time weather observation from Open-Meteo |
| `GET /api/v1/locations/{id}/traffic` | `GET` | Real-time speed, delay, and congestion index from TomTom |
| `GET /api/v1/locations/{id}/incidents` | `GET` | Active provider-reported incidents and accidents |
| `GET /api/v1/locations/{id}/risk` | `GET` | Multi-factor accident risk score (0-100) and ML severity prediction |
| `GET /api/v1/traffic-overview` | `GET` | Concurrent city-wide aggregation across all monitored locations |
| `GET /docs` | `GET` | Interactive Swagger API documentation |
| `GET /redoc` | `GET` | ReDoc API documentation |

---

## 4. Running Automated Tests

Run the full automated test suite with pytest:
```powershell
# From the workspace root:
.\backend\.venv\Scripts\python.exe -m pytest -v backend/tests

# Or with virtual environment activated:
pytest -v backend/tests
```
All tests mock network calls and run fully offline.
