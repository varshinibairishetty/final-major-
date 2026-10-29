# Smart Traffic AI - Frontend Dashboard

React + TypeScript + Vite single-page dashboard application providing real-time geospatial monitoring, incident alerts, weather telemetry, and accident risk indicators for traffic hotspots across Hyderabad, India.

---

## 1. Directory Structure

```text
frontend/
├── src/
│   ├── components/       # UI widgets (Map, LocationCard, IncidentList, FreshnessBadge)
│   ├── pages/            # View pages (Main Dashboard)
│   ├── services/         # Typed API clients calling backend endpoints
│   ├── types/            # TypeScript interfaces for API schemas and state
│   ├── hooks/            # Custom React hooks for telemetry polling and state
│   ├── App.tsx           # Top-level React component
│   └── main.tsx          # DOM mount entrypoint
├── public/               # Public static assets
├── tests/                # Component and unit tests
├── index.html            # HTML template with Leaflet styles
├── package.json          # Node dependencies and build scripts
├── tsconfig.json         # Strict TypeScript configuration
├── vite.config.ts        # Vite configuration with API reverse-proxy
└── README.md             # Frontend documentation
```

---

## 2. Setup & Execution (Phase 3 Preview)

*Note: Dependencies are scheduled for installation in Phase 3.*

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`. Requests to `/api/*` are automatically proxied to the FastAPI backend running at `http://127.0.0.1:8000`.

### 3. Build for Production
```bash
npm run build
```
The compiled static assets will be output to `frontend/dist/`.
