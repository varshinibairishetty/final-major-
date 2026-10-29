# Smart Traffic AI - Backend Service

FastAPI-powered asynchronous backend service responsible for ingesting live traffic and weather data, calculating congestion indexes, computing accident risk estimations, and serving REST endpoints to the frontend dashboard.

---

## 1. Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entrypoint & CORS middleware
│   ├── api/                 # API routers and versioned endpoints
│   │   ├── __init__.py
│   │   └── routes/          # Route handlers (traffic, weather, risk, locations)
│   ├── core/                # Configuration and environment settings
│   │   └── config.py
│   ├── models/              # Domain entities
│   ├── schemas/             # Pydantic request/response schemas
│   └── services/            # TomTom client, Open-Meteo client, risk engine
├── tests/                   # Pytest test cases
├── .env.example             # Environment configuration template
├── requirements.txt         # Python package dependencies
└── README.md                # Backend documentation
```

---

## 2. Setup & Installation (Phase 1 Preview)

*Note: Dependencies are scheduled for installation in Phase 1.*

### 1. Create a Python Virtual Environment
```bash
# From the project root or backend directory:
python -m venv .venv

# Activate on Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Activate on Linux/macOS:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory or project root:
```bash
cp .env.example .env
```
Ensure `TOMTOM_API_KEY` is populated.

### 4. Run the Development Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API documentation will be accessible at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## 3. Testing
```bash
pytest tests/
```
