import React, { useState } from 'react';
import { LocationOverview } from '../types';
import { SummaryCards } from '../components/SummaryCards';
import { LocationCard } from '../components/LocationCard';
import { LocationDetailModal } from '../components/LocationDetailModal';
import { MapView } from '../components/MapView';
import { RefreshCw, MapPin, KeyRound, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OverviewPageProps {
  locations: LocationOverview[];
  sourcesStatus: Record<string, string>;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: string | null;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  locations,
  sourcesStatus,
  isRefreshing,
  onRefresh,
  lastUpdated,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const isTomTomUnconfigured = sourcesStatus.tomtom_traffic_flow === 'unconfigured';
  const selectedLocation = locations.find((l) => l.location_id === selectedLocationId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Hyderabad Traffic & Safety Overview
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Live corridor metrics, provider incidents, and integrated accident risk predictions across Hyderabad
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* TomTom Setup Banner if unconfigured */}
      {isTomTomUnconfigured && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
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
              <strong>Live Traffic Notice:</strong> Open-Meteo weather is active. Live TomTom flow speeds and incidents require configuring your key in <code>backend/.env</code> and restarting FastAPI.
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
            TomTom Portal &rarr;
          </a>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards locations={locations} />

      {/* Main Grid: Compact Map & Hotspots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Monitored Hotspots */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Monitored Corridors ({locations.length})
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Click any card to inspect full telemetry
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {locations.map((location) => (
              <LocationCard
                key={location.location_id}
                location={location}
                isSelected={selectedLocationId === location.location_id}
                onSelect={() => setSelectedLocationId(location.location_id)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Compact Map Preview & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Map Preview Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                padding: '0.85rem 1rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                <MapPin size={16} color="#2563eb" />
                <span>Geospatial Hotspots</span>
              </div>
              <Link
                to="/map"
                style={{
                  fontSize: '0.75rem',
                  color: '#2563eb',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <span>Full Map</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ height: '320px', width: '100%' }}>
              <MapView
                locations={locations}
                selectedLocationId={selectedLocationId}
                onSelectLocation={(locId) => setSelectedLocationId(locId)}
              />
            </div>
          </div>

          {/* Multimodal Workflow Highlights */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1.1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.4rem' }}>
              <Sparkles size={16} color="#2563eb" />
              <span>Multi-Source Safety Framework</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 0.85rem' }}>
              This platform correlates 4 independent data streams without fabricating live telemetry:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.76rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <li><strong>Open-Meteo Weather:</strong> Live rain, temperature, and road surface conditions.</li>
              <li><strong>TomTom Telemetry:</strong> Real speed vs free-flow delta and provider hazards.</li>
              <li><strong>CCTV Video Tracking:</strong> YOLOv8 vehicle class counts and localized flow rates.</li>
              <li><strong>Historical Patterns:</strong> Time-of-day rush hour and junction severity baselines.</li>
            </ul>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem' }}>
              <Link
                to="/video-analytics"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                }}
              >
                Analyze Video &rarr;
              </Link>
              <Link
                to="/risk-analysis"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#2563eb',
                  borderRadius: '6px',
                  padding: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                Risk Workspace &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Location Modal */}
      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocationId(null)}
        />
      )}
    </div>
  );
};
