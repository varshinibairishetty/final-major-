# Smart Traffic AI - Frontend Dashboard

Modern, responsive React + TypeScript + Vite dashboard monitoring traffic flow, provider-reported incidents, and real-time atmospheric weather for selected corridors in **Hyderabad, India**.

---

## 1. Directory Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Top bar with service status badges and refresh controls
│   │   ├── SummaryCards.tsx        # High-level aggregate metric counters
│   │   ├── MapView.tsx             # Interactive Leaflet map with custom status markers
│   │   ├── LocationCard.tsx        # Corridor card showing speed, weather, and incidents
│   │   └── LocationDetailModal.tsx # Drill-down tabbed modal (flow, incidents, weather)
│   ├── services/
│   │   └── api.ts                  # Reusable API client connecting to FastAPI backend
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces aligned with backend schemas
│   ├── App.tsx                     # Main layout orchestrator
│   ├── main.tsx                    # React DOM mount point
│   ├── index.css                   # Global dashboard and marker styling
│   └── vite-env.d.ts               # Vite environment typing
├── public/                         # Static assets
├── .env.example                    # Frontend environment template
├── index.html                      # HTML entrypoint with Leaflet CSS link
├── package.json                    # Node dependencies and build scripts
├── tsconfig.json                   # Strict TypeScript compiler options
├── vite.config.ts                  # Vite bundler configuration with backend reverse proxy
└── README.md                       # Frontend documentation
```

---

## 2. Setup & Execution

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if you wish to override the API base URL:
```bash
cp .env.example .env
```
*(Default: `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` or proxied through `/api/v1`).*

### 3. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The compiled, type-checked static bundle is generated in `frontend/dist/`.
