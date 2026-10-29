import React from 'react';
import { RefreshCw, Activity, CloudSun, Navigation, MapPin, BrainCircuit } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  sourcesStatus?: Record<string, string>;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
  riskModelStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealthy,
  sourcesStatus = {},
  isRefreshing,
  onRefresh,
  lastUpdated,
  riskModelStatus = 'active',
}) => {
  const tomtomStatus = sourcesStatus.tomtom_traffic_flow || 'unconfigured';
  const openMeteoStatus = sourcesStatus.open_meteo || 'unknown';

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '1.25rem 2rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                background: '#2563eb',
                color: 'white',
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                Multimodal Smart Traffic AI
              </h1>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '0.1rem',
                }}
              >
                <MapPin size={14} color="#ef4444" />
                <span>Hyderabad, India — Corridor Telemetry & Safety Monitor</span>
              </p>
            </div>
          </div>
        </div>

        {/* Integration Status Badges & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Backend Health Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: backendHealthy ? '#dcfce7' : '#fee2e2',
              color: backendHealthy ? '#166534' : '#991b1b',
              border: `1px solid ${backendHealthy ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <Activity size={14} />
            <span>FastAPI: {backendHealthy ? 'Online' : 'Offline'}</span>
          </div>

          {/* Open-Meteo Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: openMeteoStatus === 'operational' ? '#e0f2fe' : '#fef9c3',
              color: openMeteoStatus === 'operational' ? '#0369a1' : '#854d0e',
              border: '1px solid #bae6fd',
            }}
          >
            <CloudSun size={14} />
            <span>Open-Meteo: {openMeteoStatus === 'operational' ? 'Active' : 'Degraded'}</span>
          </div>

          {/* TomTom Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: tomtomStatus === 'configured' ? '#dcfce7' : '#f1f5f9',
              color: tomtomStatus === 'configured' ? '#166534' : '#475569',
              border: '1px solid #cbd5e1',
            }}
            title={
              tomtomStatus === 'configured'
                ? 'TomTom Traffic API key loaded'
                : 'TomTom API key not set in backend/.env. Live flow & incidents require a key.'
            }
          >
            <Navigation size={14} />
            <span>TomTom: {tomtomStatus === 'configured' ? 'Configured' : 'Unconfigured'}</span>
          </div>

          {/* AI Risk Model Status Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: riskModelStatus === 'active' ? '#f5f3ff' : '#fef2f2',
              color: riskModelStatus === 'active' ? '#6d28d9' : '#991b1b',
              border: `1px solid ${riskModelStatus === 'active' ? '#ddd6fe' : '#fecaca'}`,
            }}
            title={
              riskModelStatus === 'active'
                ? 'RandomForest Accident Severity Model (v1.0) active in backend'
                : 'Risk prediction model offline or unavailable'
            }
          >
            <BrainCircuit size={14} />
            <span>AI Risk Model: {riskModelStatus === 'active' ? 'Active (v1.0)' : 'Unavailable'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'background 0.2s',
              opacity: isRefreshing ? 0.7 : 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
          Data freshness: {new Date(lastUpdated).toLocaleTimeString()} ({new Date(lastUpdated).toLocaleDateString()})
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
