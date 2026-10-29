import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import { Location, LocationOverview } from './types';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { VideoAnalyticsPage } from './pages/VideoAnalyticsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { HistoricalAnalyticsPage } from './pages/HistoricalAnalyticsPage';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './index.css';

export const App: React.FC = () => {
  const [locations, setLocations] = useState<LocationOverview[]>([]);
  const [configuredLocations, setConfiguredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [sourcesStatus, setSourcesStatus] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch city-wide traffic overview and configured locations
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

      // Extract basic location info
      const basicLocs: Location[] = overview.locations.map((l) => ({
        id: l.location_id,
        name: l.location_name,
        latitude: l.latitude,
        longitude: l.longitude,
        area_type: l.area_type,
      }));
      setConfiguredLocations(basicLocs);
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

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        {/* Persistent Navigation Sidebar */}
        <Sidebar backendHealthy={backendHealthy} sourcesStatus={sourcesStatus} />

        {/* Dynamic Route Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
          <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
            {/* Global Communication Error Banner */}
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
                    Failed to communicate with FastAPI backend
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
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Retry Connection</span>
                  </button>
                </div>
              </div>
            )}

            <Routes>
              {/* Page A: Overview Dashboard */}
              <Route
                path="/"
                element={
                  <OverviewPage
                    locations={locations}
                    sourcesStatus={sourcesStatus}
                    isLoading={isLoading}
                    isRefreshing={isRefreshing}
                    onRefresh={() => loadData(true)}
                    lastUpdated={lastUpdated}
                  />
                }
              />

              {/* Page B: Live Traffic Map */}
              <Route
                path="/map"
                element={
                  <LiveMapPage
                    locations={locations}
                    sourcesStatus={sourcesStatus}
                    onRefresh={() => loadData(true)}
                  />
                }
              />

              {/* Page C: CCTV and Video Analytics */}
              <Route
                path="/video-analytics"
                element={<VideoAnalyticsPage configuredLocations={configuredLocations} />}
              />

              {/* Page D: Accident Risk Analysis */}
              <Route
                path="/risk-analysis"
                element={<RiskAnalysisPage configuredLocations={configuredLocations} />}
              />

              {/* Page E: Historical Analytics */}
              <Route
                path="/historical"
                element={<HistoricalAnalyticsPage configuredLocations={configuredLocations} />}
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
