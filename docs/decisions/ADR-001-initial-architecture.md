# ADR-001: Initial Architecture and Infrastructure Minimization

- **Status:** Accepted
- **Date:** October 2026
- **Context:** Design of the Multimodal AI-Based Smart Traffic Management and Accident Prediction System for Hyderabad.

---

## 1. Context and Problem Statement

The system requires:
1. Ingesting live traffic flow and incident data (TomTom) and weather telemetry (Open-Meteo) for selected Hyderabad coordinates.
2. Normalizing these heterogeneous API payloads and computing both deterministic congestion metrics and probabilistic accident risk scores.
3. Exposing these calculations to an interactive, map-centric web dashboard with low latency and high clarity.
4. Future extension to trained Machine Learning models (scikit-learn, XGBoost) using historical accident records.

We must select an initial architectural stack that provides developer agility, rapid iteration, and strict credential isolation without introducing premature infrastructure overhead.

---

## 2. Decision

We have decided on:
1. **Backend:** Python with **FastAPI**.
2. **Frontend:** Single-Page Application (SPA) with **React**, **TypeScript**, and **Vite**.
3. **Mapping:** **Leaflet** via React-Leaflet.
4. **Deferred Infrastructure:** Explicitly **omitting** a persistent database (PostgreSQL/MySQL), Docker containers, Redis in-memory cache, and message brokers (Kafka/RabbitMQ) in this initial phase.

---

## 3. Rationale

### Why FastAPI (Python)?
- **Python Ecosystem Compatibility:** Machine Learning libraries (Pandas, scikit-learn, XGBoost) run natively in Python. Using Python for both API handling and ML scoring eliminates language impedance mismatches and avoids needing multi-service IPC or separate model serving infrastructure.
- **Asynchronous I/O Performance:** FastAPI natively leverages Python's `asyncio` and `uvicorn`, making concurrent network calls to external APIs (TomTom, Open-Meteo) via `httpx` highly performant and non-blocking.
- **Data Validation & OpenAPI:** Integrated Pydantic v2 validation ensures incoming and outgoing payloads are strictly typed, generating automatic OpenAPI/Swagger documentation.

### Why React + TypeScript + Vite?
- **Rich Geospatial Ecosystem:** React integrates cleanly with Leaflet for rendering interactive tile maps, polyline corridors, and customized alert overlays.
- **Developer Velocity & Type Safety:** Vite offers instant hot-module reloading (HMR) and fast build times, while TypeScript prevents runtime contracts and payload discrepancies between frontend and backend.

### Why Leaflet?
- **Lightweight & High Performance:** Leaflet provides smooth map rendering, custom marker overlays, and bounding-box interaction without the heavy bundle size, licensing friction, or complexity of heavy GIS platforms like Mapbox or Cesium.

### Why Avoid Databases, Docker, Redis, and Message Brokers Initially?
- **Avoid Premature Optimization:** In the early phases, the system operates on a curated set of 6–10 configured Hyderabad corridors. Location definitions can be maintained in structured configuration files (`JSON`/`Pydantic`).
- **Low Operational Friction:** Forcing developers to install and run Docker daemons, database servers, and Redis instances adds setup friction without adding immediate value.
- **In-Memory Caching Sufficiency:** A lightweight Python in-memory time-to-live (TTL) cache is more than sufficient to throttle external API rate limits (e.g., TomTom quota management) during early development.
- **Future Extensibility:** When historical persistence requirements, user authentication, or high-throughput multi-city expansion emerge, Docker and databases can be introduced with concrete, measured justification.

---

## 4. Consequences

### Positive
- Zero setup friction: developers only need Python and Node.js.
- Clean separation between API ingestion/ML backend and interactive presentation frontend.
- Backend completely isolates third-party API keys from the browser.
- Easy to test and iterate rapidly.

### Negative / Trade-offs
- Historical trends and live snapshot logs are not persisted across server restarts until a database is introduced in a later phase.
- Scaling horizontally across multiple server instances will require external caching (e.g., Redis) when that scale is demanded.
