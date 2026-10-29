# Deployment Planning, Readiness Assessment & Demonstration Guide

This document provides a comprehensive operational guide for deploying, maintaining, and demonstrating the **Multimodal AI-Based Smart Traffic Management and Accident Prediction System**.

---

## 1. Deployment Readiness Assessment

The application is architected according to strict separation of concerns, allowing the **FastAPI Python Backend** and the **React + TypeScript Frontend** to be deployed independently on modern cloud platforms.

### Architecture Decoupling & Communication
- **Protocol:** Standard RESTful JSON over HTTPS.
- **Cross-Origin Resource Sharing (CORS):** The FastAPI backend enforces a strict whitelist of frontend origins via `CORS_ORIGINS`.
- **Zero Client-Side Secrets:** Third-party credentials (such as `TOMTOM_API_KEY`) reside exclusively in backend environment variables. The frontend never accesses or proxies external APIs directly.

---

## 2. Environment Variables Matrix

| Variable | Target Layer | Required? | Default / Example | Purpose |
|---|---|---|---|---|
| `BACKEND_HOST` | Backend | Optional | `0.0.0.0` (production) | Network interface binding |
| `BACKEND_PORT` | Backend | Optional | `8000` (or `$PORT` assigned by PaaS) | Listening port |
| `ENVIRONMENT` | Backend | Required | `production` | Runtime mode (`development` vs `production`) |
| `CORS_ORIGINS` | Backend | Required | `https://your-frontend.vercel.app` | Comma-separated whitelist of allowed frontend domains |
| `TOMTOM_API_KEY` | Backend | Optional | `your_tomtom_api_key` | Authenticates TomTom Traffic Flow and Incidents API calls |
| `OPEN_METEO_BASE_URL` | Backend | Optional | `https://api.open-meteo.com/v1` | Open-Meteo endpoint root |
| `REQUEST_TIMEOUT_SECONDS` | Backend | Optional | `5.0` | Upstream API timeout constraint |
| `TRAFFIC_CACHE_TTL_SECONDS` | Backend | Optional | `300` (5 minutes) | In-memory caching duration for traffic metrics |
| `WEATHER_CACHE_TTL_SECONDS` | Backend | Optional | `900` (15 minutes) | In-memory caching duration for atmospheric data |
| `VITE_API_BASE_URL` | Frontend | Required | `https://your-backend.onrender.com/api/v1` | Base URL used by the frontend Axios/fetch client |

---

## 3. Recommended Hosting Platforms & Free-Tier Limitations

### Recommended Strategy
- **Backend:** [Render](https://render.com/), [Railway](https://railway.app/), [Fly.io](https://fly.io/), or [AWS App Runner](https://aws.amazon.com/apprunner/).
- **Frontend:** [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), or [Cloudflare Pages](https://pages.cloudflare.com/).

### Operational Constraints & Free-Tier Considerations

1. **PaaS Spin-Down / Cold Starts (Render / Railway):**
   - Free-tier web services often spin down or sleep after 15 minutes of inactivity.
   - Initial spin-up latency ("cold start") can take 45–60 seconds.
   - *Impact on Application:* The frontend will display the standard loading spinner or "Failed to communicate with backend" banner with a "Retry Connection" button until the backend finishes waking up.
2. **Open-Meteo API Limits:**
   - Free non-commercial tier permits up to 10,000 API calls/day and max 600 calls/minute.
   - *Mitigation:* The backend implements a 15-minute in-memory cache (`WEATHER_CACHE_TTL_SECONDS=900`), which limits queries to at most 4 requests/hour per junction (20 requests/hour total for all 5 junctions), staying well within 1% of the free quota.
3. **TomTom Developer API Limits:**
   - Free evaluation tier provides 2,500 non-commercial transactions/day.
   - *Mitigation:* The backend implements a 5-minute in-memory cache (`TRAFFIC_CACHE_TTL_SECONDS=300`) and aggregates flow + incident calls concurrently, keeping daily consumption under 300 calls even during frequent dashboard refreshes.
4. **Tile Layer Bandwidth (OpenStreetMap):**
   - Public OSM tile servers enforce strict fair-use policies and prohibit heavy automated bulk downloading.
   - *Mitigation:* Leaflet handles tile caching in browser memory, and the frontend includes a graceful fallback notice banner if tile requests fail or get throttled.

---

## 4. Step-by-Step Project Demonstration Plan

Follow this sequence when presenting or evaluating the live project:

```
[1. City-Wide Dashboard] ──▶ [2. Corridor Inspection] ──▶ [3. Telemetry Verification]
           │                                                        │
           ▼                                                        ▼
[6. Integrity & Error States] ◀── [5. AI Risk Breakdown] ◀── [4. Domain Disambiguation]
```

### Step 1: Open the Dashboard
- Navigate to `http://localhost:5173` (or the deployed frontend URL).
- Point out the **Header Bar**:
  - Project Title & Hyderabad location indicator.
  - Operational status pills: `FastAPI: Online`, `Open-Meteo: Active`, `TomTom: Configured` (or `Unconfigured`), and `AI Risk Model: Active (v1.0)`.
  - Data freshness timestamp and manual **Refresh** button.

### Step 2: Select a Monitored Junction
- Click on **Gachibowli Junction** or **Hitech City / Cyber Towers** on either the interactive Leaflet map or the right-hand corridor cards list.
- Note how the selected card highlights and map marker emphasizes.

### Step 3: View Available Telemetry
- Inspect the card grid:
  - **Weather:** Live temperature (e.g., 25.5°C), humidity (68%), and weather description ("Clear sky").
  - **Traffic Speed:** Current speed vs. free-flow reference speed (e.g., 40 km/h vs. 50 km/h).

### Step 4: Distinguish Incidents from Congestion
- Open the **Location Detail Modal** by clicking on the selected card.
- Emphasize the core architectural distinction:
  - **Traffic Dynamics Tab:** Shows observed traffic dynamics (speed deficit, current delay seconds, and calculated congestion ratio). Highlight that high congestion does *not* mean an accident has occurred.
  - **Reported Incidents Tab:** Shows verified external events from TomTom within 3 km. Highlight the red badge indicating verified vehicular accidents (if any) vs. routine jams or road maintenance.

### Step 5: Inspect the Accident Risk Prediction
- Switch to the **AI Risk Model** tab in the modal:
  - Note the **Estimated Accident Risk Index** (e.g., `28.6 / 100`) and categorical tier (`LOW RISK`).
  - Explain the **ML Severity Propensity**: Show `Minor` or `Severe/Fatal` propensity predicted by the RandomForest model. Clarify that this reflects historical relative severity propensity under crash conditions, not an instantaneous occurrence probability.
  - Review the **Risk Factor Breakdown**: Show the visual weighting bars for speed deficit, atmospheric weather hazard, temporal risk (night/rush hour), and road geometry.
  - Review the **Observed Inputs Audit Grid**: Show the exact raw parameters fed to the inference pipeline.

### Step 6: Demonstrate Degraded & Unavailable Data States
- **TomTom Key Missing:** Show the amber notice banner explaining that live speeds are unconfigured while weather and AI risk estimation continue to operate cleanly.
- **Provider Outage:** Show that when a provider fails, the system returns `partially_degraded` without crashing the application.
- **Zero Fabrication:** Emphasize that when telemetry is missing, the system outputs explicit `Unavailable` states rather than inventing artificial scores.

---

## 5. Recommended Visual Artifacts & Screenshot Plan

For academic presentations, portfolio showcases, or README documentation, capture the following 5 views:

| View | Target UI Component | Key Elements to Showcase |
|---|---|---|
| **1. Main Dashboard Overview** | Full browser view | Interactive Leaflet map with speed-coded pins, top 4 summary metric counters, corridor cards list, and header status badges. |
| **2. AI Risk Model Deep-Dive** | Detail Modal (`AI Risk Model` tab) | Composite Risk Index (0–100), categorical badge (`LOW`/`MODERATE`/`HIGH`), ML severity propensity, factor breakdown progress bars, and audit table. |
| **3. Traffic Dynamics & Congestion** | Detail Modal (`Traffic Dynamics` tab) | Observed speed, free-flow speed delta, travel time, delay seconds, and congestion percentage meter. |
| **4. Reported Incidents vs. Accidents** | Detail Modal (`Reported Incidents` tab) | Incident cards with distance in km, category badges (`JAM`, `ROAD_WORKS`, `ACCIDENT`), and verified collision flags. |
| **5. Unconfigured & Fallback Resilience** | Dashboard with missing TomTom key | Amber TomTom configuration notice banner, "Unconfigured" card indicators, and live Open-Meteo weather continuing without interruption. |

*(All screenshots should be captured directly from the live application without synthetic graphics or manipulated metrics).*
