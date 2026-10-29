import React from 'react';
import { LocationOverview } from '../types';
import { CloudSun, Gauge, AlertTriangle, ChevronRight, Clock, BrainCircuit, ShieldAlert } from 'lucide-react';

interface LocationCardProps {
  location: LocationOverview;
  isSelected: boolean;
  onSelect: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
}) => {
  const { location_name, area_type, weather, traffic_flow, incidents, risk_assessment } = location;

  const flow = traffic_flow;
  const inc = incidents;
  const accidents = inc.incidents.filter((i) => i.is_confirmed_accident).length;

  const hasValidRisk =
    risk_assessment &&
    risk_assessment.status === 'success' &&
    risk_assessment.risk_score !== null &&
    risk_assessment.risk_score !== undefined;

  const riskLevel = risk_assessment?.risk_level || 'UNAVAILABLE';
  const riskScore = risk_assessment?.risk_score;

  // Risk tier color styling
  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'HIGH':
        return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
      case 'MODERATE':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'LOW':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const riskStyle = getRiskStyles(riskLevel);

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
        padding: '1.15rem',
        boxShadow: isSelected
          ? '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -2px rgba(37, 99, 235, 0.06)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
      }}
      onMouseOver={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseOut={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {location_name}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'inline-block', marginTop: '0.15rem' }}>
            {area_type || 'Monitored Junction'}
          </span>
        </div>

        <div style={{ color: isSelected ? '#2563eb' : '#94a3b8' }}>
          <ChevronRight size={18} />
        </div>
      </div>

      {/* Telemetry Metric Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.6rem',
          fontSize: '0.8rem',
        }}
      >
        {/* Weather Box */}
        <div
          style={{
            background: '#f8fafc',
            padding: '0.6rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', marginBottom: '0.2rem' }}>
            <CloudSun size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Weather</span>
          </div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>
            {weather.temperature_c !== null && weather.temperature_c !== undefined
              ? `${weather.temperature_c}°C`
              : 'N/A'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {weather.weather_description}
          </div>
        </div>

        {/* Traffic Flow Box */}
        <div
          style={{
            background: '#f8fafc',
            padding: '0.6rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', marginBottom: '0.2rem' }}>
            <Gauge size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Traffic Speed</span>
          </div>
          {flow.status === 'success' && flow.current_speed_kmh !== null && flow.current_speed_kmh !== undefined ? (
            <>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {flow.current_speed_kmh} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>km/h</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Free flow: {flow.free_flow_speed_kmh} km/h
              </div>
            </>
          ) : flow.status === 'unconfigured' ? (
            <>
              <div style={{ fontWeight: 600, color: '#64748b' }}>Unconfigured</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>API key required</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, color: '#dc2626' }}>Unavailable</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No segment data</div>
            </>
          )}
        </div>
      </div>

      {/* Incidents & Congestion Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle
            size={14}
            color={accidents > 0 ? '#dc2626' : (inc.incident_count || 0) > 0 ? '#d97706' : '#16a34a'}
          />
          <span style={{ color: '#475569' }}>
            {inc.status === 'success'
              ? `${inc.incident_count || 0} reported incidents ${accidents > 0 ? `(${accidents} verified accident)` : ''}`
              : inc.status === 'unconfigured'
              ? 'Incidents unconfigured'
              : 'Incidents unavailable'}
          </span>
        </div>

        {flow.status === 'success' && flow.congestion_ratio !== null && flow.congestion_ratio !== undefined && (
          <div
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: flow.congestion_ratio >= 0.4 ? '#fee2e2' : flow.congestion_ratio >= 0.2 ? '#fef3c7' : '#dcfce7',
              color: flow.congestion_ratio >= 0.4 ? '#991b1b' : flow.congestion_ratio >= 0.2 ? '#92400e' : '#166534',
            }}
            title="Observed traffic speed deficit (traffic congestion), distinct from accidents"
          >
            {Math.round(flow.congestion_ratio * 100)}% Congestion
          </div>
        )}
      </div>

      {/* Predicted Accident Risk Section */}
      {hasValidRisk ? (
        <div
          style={{
            background: riskStyle.bg,
            border: `1px solid ${riskStyle.border}`,
            padding: '0.55rem 0.75rem',
            borderRadius: '6px',
            color: riskStyle.text,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <BrainCircuit size={15} />
              <span>Predicted Risk: {riskLevel} ({riskScore} / 100)</span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.9 }}>
              {risk_assessment?.predicted_severity_class} Propensity
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', marginTop: '0.2rem', opacity: 0.85 }}>
            Model estimate (v1.0) &bull; Not a confirmed accident
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '0.55rem 0.75rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.72rem',
            color: '#64748b',
          }}
        >
          <ShieldAlert size={15} color="#94a3b8" />
          <span>
            Predicted Risk: <strong>Unavailable</strong> ({risk_assessment?.error_message || 'Awaiting telemetry'})
          </span>
        </div>
      )}

      {/* Footer Timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          fontSize: '0.68rem',
          color: '#94a3b8',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '0.5rem',
        }}
      >
        <Clock size={12} />
        <span>
          Telemetry: {new Date(weather.timestamp || flow.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
