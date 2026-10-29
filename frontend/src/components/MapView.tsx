import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LocationOverview } from '../types';
import { Info, AlertCircle, ArrowUpRight } from 'lucide-react';

interface MapViewProps {
  locations: LocationOverview[];
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const [hasTileError, setHasTileError] = useState(false);

  // Center coordinate on Hyderabad (approx 17.44, 78.38)
  const defaultCenter: [number, number] = [17.445, 78.385];
  const defaultZoom = 12;

  // Custom DivIcon generator based on live telemetry status
  const createMarkerIcon = (loc: LocationOverview, isSelected: boolean) => {
    const flow = loc.traffic_flow;
    const inc = loc.incidents;

    let markerClass = 'marker-unconfigured';
    let label = '—';

    if (flow.status === 'success' && flow.current_speed_kmh !== undefined && flow.current_speed_kmh !== null) {
      label = `${flow.current_speed_kmh}`;
      const ratio = flow.congestion_ratio || 0;
      const hasAccident = inc.incidents.some((i) => i.is_confirmed_accident);

      if (hasAccident || ratio >= 0.5 || flow.road_closure) {
        markerClass = 'marker-heavy';
      } else if (ratio >= 0.25) {
        markerClass = 'marker-moderate';
      } else {
        markerClass = 'marker-healthy';
      }
    } else if (loc.weather.status === 'success') {
      markerClass = 'marker-healthy';
      label = '•';
    }

    const size = isSelected ? 36 : 28;

    return L.divIcon({
      className: '',
      html: `
        <div class="custom-leaflet-marker ${markerClass}" style="
          width: ${size}px;
          height: ${size}px;
          border-width: ${isSelected ? '3px' : '2px'};
          border-color: ${isSelected ? '#1e293b' : '#ffffff'};
          box-shadow: ${isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.4)' : '0 2px 4px rgba(0,0,0,0.2)'};
        ">
          ${label}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Hyderabad Geospatial Traffic Map
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
            OpenStreetMap tiles with configured junction coordinates. Select any marker for details.
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }}></span>
            <span>Smooth Flow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d97706' }}></span>
            <span>Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }}></span>
            <span>Heavy / Incident</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#64748b' }}></span>
            <span>Pending API</span>
          </div>
        </div>
      </div>

      {hasTileError && (
        <div
          style={{
            background: '#fffbeb',
            color: '#b45309',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid #fef3c7',
          }}
        >
          <AlertCircle size={15} />
          <span>Notice: Network connectivity to public tile server is limited. Markers remain interactive.</span>
        </div>
      )}

      <div style={{ height: '440px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setHasTileError(true),
            }}
          />

          {locations.map((loc) => {
            const isSelected = selectedLocationId === loc.location_id;
            const flow = loc.traffic_flow;
            const weather = loc.weather;
            const inc = loc.incidents;

            return (
              <Marker
                key={loc.location_id}
                position={[loc.latitude, loc.longitude]}
                icon={createMarkerIcon(loc, isSelected)}
                eventHandlers={{
                  click: () => onSelectLocation(loc.location_id),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', padding: '0.2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: '#0f172a' }}>
                      {loc.location_name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      {loc.area_type || 'Monitored Junction'}
                    </div>

                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>Weather:</strong>{' '}
                        {weather.temperature_c !== null && weather.temperature_c !== undefined
                          ? `${weather.temperature_c}°C, ${weather.weather_description}`
                          : weather.weather_description}
                      </div>
                      <div>
                        <strong>Traffic Flow:</strong>{' '}
                        {flow.status === 'success' && flow.current_speed_kmh !== null
                          ? `${flow.current_speed_kmh} km/h (Free: ${flow.free_flow_speed_kmh} km/h)`
                          : flow.status === 'unconfigured'
                          ? 'TomTom Unconfigured'
                          : 'Unavailable'}
                      </div>
                      <div>
                        <strong>Reported Incidents:</strong>{' '}
                        {inc.incident_count !== null && inc.incident_count !== undefined
                          ? inc.incident_count
                          : 'Unknown'}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectLocation(loc.location_id)}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>View Full Details</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div
        style={{
          padding: '0.6rem 1.25rem',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.74rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
        <Info size={14} color="#64748b" />
        <span>
          Note: Base road network represents OpenStreetMap geometry. Numerical markers indicate current observed speed (km/h) at the configured junction coordinates.
        </span>
      </div>
    </div>
  );
};
