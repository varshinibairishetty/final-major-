import React, { useState, useEffect } from 'react';
import { LocationOverview, RiskAssessmentResponse } from '../types';
import { api } from '../services/api';
import {
  X,
  MapPin,
  CloudSun,
  Gauge,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle2,
  BrainCircuit,
  Activity,
} from 'lucide-react';

interface LocationDetailModalProps {
  location: LocationOverview | null;
  onClose: () => void;
}

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  location,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'traffic' | 'incidents' | 'weather'>('risk');
  const [riskData, setRiskData] = useState<RiskAssessmentResponse | null>(null);
  const [isRiskLoading, setIsRiskLoading] = useState<boolean>(false);

  useEffect(() => {
    if (location) {
      setIsRiskLoading(true);
      api
        .getLocationRisk(location.location_id)
        .then((res) => setRiskData(res))
        .catch(() => setRiskData(null))
        .finally(() => setIsRiskLoading(false));
    } else {
      setRiskData(null);
    }
  }, [location]);

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
            onClick={() => setActiveTab('risk')}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'risk' ? '#2563eb' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === 'risk' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'risk' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <BrainCircuit size={16} />
            <span>AI Risk Model</span>
          </button>

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
          {/* TAB 0: AI RISK ASSESSMENT */}
          {activeTab === 'risk' && (
            <div>
              {isRiskLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  <Activity size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem auto', color: '#2563eb' }} />
                  <div>Evaluating live multi-modal risk pipeline...</div>
                </div>
              ) : riskData ? (
                <div>
                  {/* Risk Score & Level Box */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      border: '1px solid #e2e8f0',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                        Estimated Accident Risk Index
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a' }}>
                          {riskData.risk_score}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          background:
                            riskData.risk_level === 'CRITICAL'
                              ? '#fee2e2'
                              : riskData.risk_level === 'HIGH'
                              ? '#ffedd5'
                              : riskData.risk_level === 'MODERATE'
                              ? '#fef3c7'
                              : '#dcfce7',
                          color:
                            riskData.risk_level === 'CRITICAL'
                              ? '#991b1b'
                              : riskData.risk_level === 'HIGH'
                              ? '#9a3412'
                              : riskData.risk_level === 'MODERATE'
                              ? '#92400e'
                              : '#166534',
                          border: '1px solid currentColor',
                        }}
                      >
                        {riskData.risk_level} RISK
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                        Pipeline: <strong>{riskData.model_status}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ML Severity Prediction */}
                  <div
                    style={{
                      background: '#f1f5f9',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.2rem' }}>
                      ML Model Severity Propensity: <span style={{ color: '#2563eb' }}>{riskData.predicted_severity_class}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      Calibrated Severe Injury Probability: <strong>{Math.round(riskData.severity_probability * 100)}%</strong> (Model: {riskData.model_version})
                    </div>
                  </div>

                  {/* Factor Contribution Progress Bars */}
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.6rem' }}>
                    Risk Factor Breakdown:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '0.2rem' }}>
                        <span>Congestion & Speed Deficit Weight</span>
                        <span>{Math.round(riskData.contributing_factors.congestion_factor * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${riskData.contributing_factors.congestion_factor * 100}%`, background: '#2563eb' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '0.2rem' }}>
                        <span>Atmospheric Weather Hazard Weight</span>
                        <span>{Math.round(riskData.contributing_factors.weather_factor * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${riskData.contributing_factors.weather_factor * 100}%`, background: '#0284c7' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '0.2rem' }}>
                        <span>Temporal Hazard (Rush Hour / Night)</span>
                        <span>{Math.round(riskData.contributing_factors.temporal_factor * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${riskData.contributing_factors.temporal_factor * 100}%`, background: '#d97706' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '0.2rem' }}>
                        <span>Roadway & Junction Geometry</span>
                        <span>{Math.round(riskData.contributing_factors.road_geometry_factor * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${riskData.contributing_factors.road_geometry_factor * 100}%`, background: '#64748b' }} />
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Integrity Note */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1.25rem',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span>{riskData.limitations_note}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
                  <ShieldAlert size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Risk assessment service is currently unavailable.</div>
                </div>
              )}
            </div>
          )}

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
