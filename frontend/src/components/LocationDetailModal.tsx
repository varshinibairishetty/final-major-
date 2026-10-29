import React, { useState } from 'react';
import { LocationOverview } from '../types';
import {
  X,
  MapPin,
  CloudSun,
  Gauge,
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LocationDetailModalProps {
  location: LocationOverview | null;
  onClose: () => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'traffic' | 'incidents' | 'weather'>('traffic');

  if (!location) return null;

  const { location_name, area_type, latitude, longitude, weather, traffic_flow, incidents } = location;
  const flow = traffic_flow;
  const inc = incidents;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#f8fafc',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', marginBottom: '0.2rem' }}>
              <MapPin size={16} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {area_type || 'Monitored Junction'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {location_name}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
              Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#cbd5e1')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            padding: '0 1rem',
          }}
        >
          <button
            onClick={() => setActiveTab('traffic')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'traffic' ? '#2563eb' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === 'traffic' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'traffic' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Gauge size={16} />
            <span>Traffic Dynamics</span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'incidents' ? '#2563eb' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === 'incidents' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'incidents' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>Reported Incidents ({inc.incident_count || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('weather')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'weather' ? '#2563eb' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === 'weather' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'weather' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <CloudSun size={16} />
            <span>Weather Telemetry</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: TRAFFIC FLOW */}
          {activeTab === 'traffic' && (
            <div>
              {flow.status === 'success' ? (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Speed</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                        {flow.current_speed_kmh} <span style={{ fontSize: '0.8rem' }}>km/h</span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Free-Flow Speed</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                        {flow.free_flow_speed_kmh} <span style={{ fontSize: '0.8rem' }}>km/h</span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Estimated Delay</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: flow.delay_sec && flow.delay_sec > 60 ? '#d97706' : '#16a34a' }}>
                        {flow.delay_sec || 0} <span style={{ fontSize: '0.8rem' }}>seconds</span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Congestion Index</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2563eb' }}>
                        {Math.round((flow.congestion_ratio || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
                    <div><strong>Travel Time:</strong> {flow.current_travel_time_sec}s (normal: {flow.free_flow_travel_time_sec}s)</div>
                    <div><strong>Road Category:</strong> {flow.road_category || 'Arterial'}</div>
                    <div><strong>Road Closure:</strong> {flow.road_closure ? 'Yes — Road closure active' : 'No active closures'}</div>
                    <div><strong>Provider Confidence:</strong> {Math.round((flow.confidence || 0) * 100)}%</div>
                  </div>
                </div>
              ) : flow.status === 'unconfigured' ? (
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <ShieldAlert size={36} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    TomTom Traffic API Key Required
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', margin: '0.5rem auto' }}>
                    Live speed and travel time telemetry requires a valid TomTom developer key in <code>backend/.env</code>.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>
                    Traffic Flow Data Unavailable
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: '0.5rem auto' }}>
                    {flow.error_message || 'Could not locate a mapped segment near these coordinates.'}
                  </p>
                </div>
              )}

              {/* Technical Limitation Disclaimer */}
              <div
                style={{
                  background: '#f1f5f9',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  color: '#64748b',
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '1rem',
                }}
              >
                <Info size={16} style={{ flexShrink: 0 }} />
                <span>{flow.limitation_note}</span>
              </div>
            </div>
          )}

          {/* TAB 2: INCIDENTS */}
          {activeTab === 'incidents' && (
            <div>
              {inc.status === 'success' ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    Provider-reported events within <strong>{inc.search_radius_km} km</strong> (Haversine radius matching):
                  </div>

                  {inc.incidents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 0.75rem auto' }} />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                        No Active Incidents Reported
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '0.3rem' }}>
                        TomTom reports no active roadworks, collisions, or closures within {inc.search_radius_km} km.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {inc.incidents.map((incident) => (
                        <div
                          key={incident.id}
                          style={{
                            background: incident.is_confirmed_accident ? '#fef2f2' : '#f8fafc',
                            border: `1px solid ${incident.is_confirmed_accident ? '#fecaca' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  background: incident.is_confirmed_accident ? '#dc2626' : '#d97706',
                                  color: 'white',
                                }}
                              >
                                {incident.category}
                              </span>
                              {incident.is_confirmed_accident && (
                                <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                                  Verified Accident
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {incident.distance_km ? `${incident.distance_km} km away` : ''}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', margin: '0.4rem 0' }}>
                            {incident.description}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                            {incident.delay_sec ? <span>Delay: {incident.delay_sec}s</span> : null}
                            <span>Severity: {incident.severity}</span>
                            {incident.from_location && <span>From: {incident.from_location}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : inc.status === 'unconfigured' ? (
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <ShieldAlert size={36} color="#64748b" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    TomTom Incidents Service Unconfigured
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '420px', margin: '0.5rem auto' }}>
                    Reported incidents feed requires a valid TomTom developer key in <code>backend/.env</code>.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>
                    Incidents Service Unavailable
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#7f1d1d', margin: '0.5rem auto' }}>
                    {inc.error_message || 'Could not contact incidents provider API.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEATHER */}
          {activeTab === 'weather' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Temperature</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                    {weather.temperature_c !== null ? `${weather.temperature_c}°C` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Condition</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}>
                    {weather.weather_description}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Precipitation / Rain</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: (weather.rain_mm || 0) > 0 ? '#0284c7' : '#0f172a' }}>
                    {weather.precipitation_mm ?? 0} mm
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Relative Humidity</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    {weather.relative_humidity_pct ?? 'N/A'}%
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Wind Speed (10m)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                    {weather.wind_speed_kmh ?? 'N/A'} km/h
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Data Source</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0369a1' }}>
                    {weather.source}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Observation Time: {weather.timestamp ? new Date(weather.timestamp).toLocaleString() : 'Recent'}
              </div>
            </div>
          )}

          {/* Persistent Phase 4 Notice */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <ShieldCheck size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Accident Risk Prediction:</strong> Prediction not available yet. Supervised ML modeling (scikit-learn & XGBoost) on historical Hyderabad accident records will be introduced in Phase 4.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
