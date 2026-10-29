import React, { useState } from 'react';
import { LocationOverview } from '../types';
import { MapView } from '../components/MapView';
import { LocationDetailModal } from '../components/LocationDetailModal';
import {
  MapPin,
  Gauge,
  CloudSun,
  AlertTriangle,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveMapPageProps {
  locations: LocationOverview[];
  sourcesStatus: Record<string, string>;
  onRefresh: () => void;
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({ locations }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'congested' | 'incidents' | 'risk'>('all');

  const filteredLocations = locations.filter((loc) => {
    if (activeFilter === 'congested') {
      return (loc.traffic_flow.congestion_ratio || 0) >= 0.2;
    }
    if (activeFilter === 'incidents') {
      return (loc.incidents.incident_count || 0) > 0;
    }
    if (activeFilter === 'risk') {
      const level = loc.risk_assessment?.risk_level;
      return level === 'HIGH' || level === 'CRITICAL';
    }
    return true;
  });

  const selectedLocation = locations.find((l) => l.location_id === selectedLocationId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 3rem)' }}>
      {/* Header Controls */}
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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Hyderabad Live Traffic & Spatial Map
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Interactive Leaflet spatial view of configured monitored corridors, live weather, flow speeds, and provider incidents
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={13} /> Filter:
          </span>
          {[
            { id: 'all', label: `All Corridors (${locations.length})` },
            { id: 'congested', label: 'Congested' },
            { id: 'incidents', label: 'Active Incidents' },
            { id: 'risk', label: 'Elevated Risk' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === f.id ? '#2563eb' : '#f1f5f9',
                color: activeFilter === f.id ? '#ffffff' : '#475569',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Selected Inspector Sidebar */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1rem', minHeight: 0 }}>
        {/* Full Interactive Map */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            height: '100%',
            position: 'relative',
          }}
        >
          <MapView
            locations={filteredLocations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(locId) => setSelectedLocationId(locId)}
          />
        </div>

        {/* Right Inspector Panel */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {selectedLocation ? (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600 }}>
                  <MapPin size={15} />
                  <span>Selected Corridor</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0 0' }}>
                  {selectedLocation.location_name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E • {selectedLocation.area_type || 'Urban Arterial'}
                </div>
              </div>

              {/* Weather Telemetry Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#0284c7', marginBottom: '0.4rem' }}>
                  <CloudSun size={15} />
                  <span>Open-Meteo Weather</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedLocation.weather.temperature_c ?? '--'}°C • {selectedLocation.weather.weather_description}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Rain: {selectedLocation.weather.rain_mm ?? 0} mm • Wind: {selectedLocation.weather.wind_speed_kmh ?? 0} km/h
                </div>
              </div>

              {/* Traffic Flow Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', marginBottom: '0.4rem' }}>
                  <Gauge size={15} />
                  <span>TomTom Traffic Flow</span>
                </div>
                {selectedLocation.traffic_flow.status === 'success' ? (
                  <>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      {selectedLocation.traffic_flow.current_speed_kmh} km/h (Free-flow: {selectedLocation.traffic_flow.free_flow_speed_kmh} km/h)
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Delay: {selectedLocation.traffic_flow.delay_sec ?? 0}s • Congestion: {Math.round((selectedLocation.traffic_flow.congestion_ratio || 0) * 100)}%
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {selectedLocation.traffic_flow.status === 'unconfigured'
                      ? 'TomTom key unconfigured in backend/.env'
                      : 'No segment telemetry available'}
                  </div>
                )}
              </div>

              {/* Incidents Box */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#d97706', marginBottom: '0.4rem' }}>
                  <AlertTriangle size={15} />
                  <span>Reported Incidents</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  {selectedLocation.incidents.incident_count || 0} event(s) within 3km
                </div>
              </div>

              {/* Risk Summary & Deep Link */}
              <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af' }}>Composite Accident Risk</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: '#1d4ed8',
                      color: 'white',
                    }}
                  >
                    {selectedLocation.risk_assessment?.risk_level || 'UNAVAILABLE'}
                  </span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.25rem' }}>
                  {selectedLocation.risk_assessment?.risk_score !== null && selectedLocation.risk_assessment?.risk_score !== undefined
                    ? `${selectedLocation.risk_assessment.risk_score} / 100`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '0.2rem' }}>
                  {selectedLocation.risk_assessment?.predicted_severity_class
                    ? `ML Severity: ${selectedLocation.risk_assessment.predicted_severity_class}`
                    : 'Hybrid weather baseline'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                <Link
                  to={`/risk-analysis?location=${selectedLocation.location_id}`}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <ShieldAlert size={15} />
                  <span>Open Risk Analysis Workspace</span>
                </Link>
                <button
                  onClick={() => setSelectedLocationId(null)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.75rem',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Clear Selection
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#94a3b8',
                gap: '0.5rem',
              }}
            >
              <MapPin size={32} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>
                No Corridor Selected
              </div>
              <div style={{ fontSize: '0.75rem', maxWidth: '220px' }}>
                Click on any map marker or hotspot card to inspect live speed, weather, and incidents.
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocationId(null)}
        />
      )}
    </div>
  );
};
