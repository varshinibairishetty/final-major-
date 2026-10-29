import React from 'react';

export const App: React.FC = () => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#111827', fontSize: '1.75rem', margin: 0 }}>
          Multimodal AI-Based Smart Traffic Management and Accident Prediction System
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          Monitoring Hyderabad, India corridors with API-driven traffic and weather telemetry.
        </p>
      </header>

      <main>
        <div style={{ background: '#f3f4f6', padding: '1.25rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#1f2937', marginTop: 0 }}>
            Phase 0: Repository Setup & Scaffolding
          </h2>
          <p style={{ color: '#4b5563', lineHeight: '1.5' }}>
            The frontend skeleton is ready. Interactive Leaflet geospatial map, real-time TomTom traffic metrics,
            Open-Meteo weather readings, and accident risk scoring will be integrated in subsequent phases.
          </p>
          <div style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
            Status: Initialized (Dependencies pending installation)
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
