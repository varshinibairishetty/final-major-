import React from 'react';
import { MapPin, Gauge, AlertTriangle, BrainCircuit } from 'lucide-react';
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

  // Risk evaluation metrics
  const locationsWithRisk = locations.filter(
    (loc) => loc.risk_assessment && loc.risk_assessment.status === 'success' && loc.risk_assessment.risk_score !== null
  );
  const elevatedRiskLocations = locationsWithRisk.filter(
    (loc) => loc.risk_assessment?.risk_level === 'HIGH' || loc.risk_assessment?.risk_level === 'CRITICAL'
  ).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* 1. Monitored Corridors */}
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
            Monitored Corridors
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {totalMonitored}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Hyderabad Major Junctions</div>
        </div>
      </div>

      {/* 2. Traffic Congestion & Speeds */}
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
            Traffic Congestion
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {locationsWithTraffic} / {totalMonitored}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {locationsWithTraffic > 0 ? 'Live speeds active (Not accidents)' : 'Awaiting TomTom API key'}
          </div>
        </div>
      </div>

      {/* 3. Provider-Reported Incidents */}
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
            Reported Incidents
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {totalIncidents}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {confirmedAccidents > 0 ? `${confirmedAccidents} verified collision(s)` : 'TomTom external provider events'}
          </div>
        </div>
      </div>

      {/* 4. Predicted Accident Risk */}
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
            background: elevatedRiskLocations > 0 ? '#fef2f2' : '#f5f3ff',
            color: elevatedRiskLocations > 0 ? '#dc2626' : '#7c3aed',
            padding: '0.75rem',
            borderRadius: '8px',
            display: 'flex',
          }}
        >
          <BrainCircuit size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Predicted Accident Risk
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: elevatedRiskLocations > 0 ? '#dc2626' : '#0f172a',
            }}
          >
            {elevatedRiskLocations > 0
              ? `${elevatedRiskLocations} Elevated`
              : `${locationsWithRisk.length} Evaluated`}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Model estimate (Not confirmed accidents)
          </div>
        </div>
      </div>
    </div>
  );
};
