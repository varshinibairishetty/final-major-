# Smart Traffic AI - Backend Service

FastAPI-powered asynchronous backend service responsible for managing monitored locations, ingesting live traffic and weather data, calculating congestion indexes, computing accident risk estimations, and serving REST endpoints to the frontend dashboard.

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
│   │       └── locations.py # Hyderabad locations endpoint (/api/v1/locations)
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py        # Environment settings (safe representation, no leaked secrets)
│   ├── models/              # Domain entities
│   ├── schemas/             # Pydantic validation schemas
│   │   ├── __init__.py
│   │   └── location.py      # Location and LocationListResponse models
│   └── services/            # Core business logic and external API integrations
│       ├── __init__.py
│       └── location_service.py # Authoritative location loader
├── tests/                   # Automated pytest suite
│   ├── __init__.py
│   └── test_api.py          # Route tests (root, health, locations)
├── .env.example             # Environment configuration template
├── requirements.txt         # Minimal production and test dependencies
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

### 3. Environment Configuration (Optional for Phase 1)
Copy `.env.example` to `.env` in the `backend/` folder:
```powershell
Copy-Item backend\.env.example backend\.env
```
*(The backend runs in Phase 1 with safe defaults even without `.env` or without a TomTom API key).*

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

Once running, interactive API documentation is available at:
- **Root Status:** `http://127.0.0.1:8000/`
- **Health Check:** `http://127.0.0.1:8000/api/v1/health`
- **Monitored Locations:** `http://127.0.0.1:8000/api/v1/locations`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Alternative ReDoc Docs:** `http://127.0.0.1:8000/redoc`

---

## 3. Running Automated Tests

Run the test suite using pytest:
```powershell
# From the workspace root:
.\backend\.venv\Scripts\python.exe -m pytest -v backend/tests

# Or with virtual environment activated:
pytest -v backend/tests
```
Tests run fully offline and do not require internet access or external credentials.
