import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { LocationOverview } from './types';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { MapView } from './components/MapView';
import { LocationCard } from './components/LocationCard';
import { LocationDetailModal } from './components/LocationDetailModal';
import { AlertCircle, RefreshCw, Info, KeyRound } from 'lucide-react';
import './index.css';

export const App: React.FC = () => {
  const [locations, setLocations] = useState<LocationOverview[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [sourcesStatus, setSourcesStatus] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch city-wide traffic overview
  const loadData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 1. Health check
      try {
        const health = await api.checkHealth();
        setBackendHealthy(health.status === 'healthy');
      } catch {
        setBackendHealthy(false);
      }

      // 2. Fetch traffic overview
      const overview = await api.getTrafficOverview(forceRefresh);
      setLocations(overview.locations);
      setSourcesStatus(overview.sources_status);
      setLastUpdated(overview.timestamp);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while loading traffic telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const selectedLocation = locations.find((l) => l.location_id === selectedLocationId) || null;
  const isTomTomUnconfigured = sourcesStatus.tomtom_traffic_flow === 'unconfigured';
  const isRiskModelActive = locations.some((l) => l.risk_assessment && l.risk_assessment.status === 'success');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        backendHealthy={backendHealthy}
        sourcesStatus={sourcesStatus}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
        lastUpdated={lastUpdated}
        riskModelStatus={isRiskModelActive ? 'active' : 'unavailable'}
      />

      <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* TomTom Configuration Notice Banner */}
        {isTomTomUnconfigured && !error && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontSize: '0.82rem',
              color: '#92400e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <KeyRound size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Notice:</strong> Open-Meteo weather telemetry is live. Live traffic speeds and provider incidents require adding your <code>TOMTOM_API_KEY</code> to <code>backend/.env</code>.
              </div>
            </div>
            <a
              href="https://developer.tomtom.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#b45309',
                fontWeight: 600,
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}
            >
              Get Free Key &rarr;
            </a>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              color: '#991b1b',
            }}
          >
            <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                Failed to communicate with backend
              </h3>
              <p style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: '#7f1d1d' }}>
                {error}
              </p>
              <button
                onClick={() => loadData(true)}
                style={{
                  marginTop: '0.75rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <RefreshCw size={14} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              padding: '4rem 1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: '#64748b',
            }}
          >
            <RefreshCw
              size={36}
              style={{
                animation: 'spin 1.2s linear infinite',
                color: '#2563eb',
              }}
            />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
              Loading Hyderabad Corridor Telemetry...
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Fetching concurrent weather, flow, and incident feeds
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {!isLoading && !error && (
          <>
            {/* Top Metric Summary Cards */}
            <SummaryCards locations={locations} />

            {/* Split Grid: Map View (left) + Location Cards (right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '1.5rem',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Leaflet Geospatial Map */}
              <div>
                <MapView
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={(id) => setSelectedLocationId(id)}
                />

                <div
                  style={{
                    marginTop: '1rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                  <span>
                    Locations monitored: Gachibowli, Hitech City, Madhapur, Kukatpally, Jubilee Hills. Click on any map marker or location card to view detailed telemetry and raw metrics.
                  </span>
                </div>
              </div>

              {/* Right Column: Location Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    Monitored Corridors ({locations.length})
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Click card to drill down
                  </span>
                </div>

                {locations.map((loc) => (
                  <LocationCard
                    key={loc.location_id}
                    location={loc}
                    isSelected={selectedLocationId === loc.location_id}
                    onSelect={() => setSelectedLocationId(loc.location_id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Selected Location Drill-Down Modal */}
      <LocationDetailModal
        location={selectedLocation}
        onClose={() => setSelectedLocationId(null)}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '1rem 2rem',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#94a3b8',
          marginTop: 'auto',
        }}
      >
        Multimodal AI-Based Smart Traffic Management & Accident Prediction System &bull; Hyderabad Telemetry &bull; Phase 5 Integrated Dashboard
      </footer>
    </div>
  );
};

export default App;
