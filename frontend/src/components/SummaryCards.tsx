import React from 'react';
import { MapPin, Gauge, AlertTriangle, ShieldAlert } from 'lucide-react';
import { LocationOverview } from '../types';

interface SummaryCardsProps {
  locations: LocationOverview[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ locations }) => {
  const totalMonitored = locations.length;

  const locationsWithTraffic = locations.filter(
    (loc) => loc.traffic_flow.status === 'success'
  ).length;

  const totalIncidents = locations.reduce((acc, loc) => {
    return acc + (loc.incidents.incident_count || 0);
  }, 0);

  const confirmedAccidents = locations.reduce((acc, loc) => {
    const accCount = loc.incidents.incidents.filter((i) => i.is_confirmed_accident).length;
    return acc + accCount;
  }, 0);

  const locationsNeedingAttention = locations.filter((loc) => {
    const flow = loc.traffic_flow;
    const inc = loc.incidents;
    const highCongestion = (flow.congestion_ratio || 0) >= 0.35;
    const roadClosed = flow.road_closure;
    const hasAccident = inc.incidents.some((i) => i.is_confirmed_accident);
    return highCongestion || roadClosed || hasAccident;
  }).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* 1. Monitored Locations */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            background: '#eff6ff',
            color: '#2563eb',
            padding: '0.75rem',
            borderRadius: '8px',
            display: 'flex',
          }}
        >
          <MapPin size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Monitored Locations
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {totalMonitored}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Hyderabad Major Junctions</div>
        </div>
      </div>

      {/* 2. Live Flow Availability */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            background: '#ecfdf5',
            color: '#10b981',
            padding: '0.75rem',
            borderRadius: '8px',
            display: 'flex',
          }}
        >
          <Gauge size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Traffic Flow Telemetry
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {locationsWithTraffic} / {totalMonitored}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {locationsWithTraffic > 0 ? 'Live speeds active' : 'Awaiting TomTom API key'}
          </div>
        </div>
      </div>

      {/* 3. Reported Incidents */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            background: '#fffbeb',
            color: '#d97706',
            padding: '0.75rem',
            borderRadius: '8px',
            display: 'flex',
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Reported Road Incidents
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {totalIncidents}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {confirmedAccidents > 0 ? `${confirmedAccidents} verified accident(s)` : 'Provider-reported events'}
          </div>
        </div>
      </div>

      {/* 4. Attention Required */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '1rem 1.25rem',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            background: locationsNeedingAttention > 0 ? '#fef2f2' : '#f8fafc',
            color: locationsNeedingAttention > 0 ? '#ef4444' : '#64748b',
            padding: '0.75rem',
            borderRadius: '8px',
            display: 'flex',
          }}
        >
          <ShieldAlert size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Requiring Attention
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: locationsNeedingAttention > 0 ? '#dc2626' : '#0f172a',
            }}
          >
            {locationsNeedingAttention}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {locationsNeedingAttention > 0 ? 'High congestion or hazards' : 'Normal conditions'}
          </div>
        </div>
      </div>
    </div>
  );
};
