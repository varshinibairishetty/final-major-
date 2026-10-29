import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Location, HistoricalRecord, HistoricalSummary } from '../types';
import {
  Filter,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface HistoricalAnalyticsPageProps {
  configuredLocations: Location[];
}

export const HistoricalAnalyticsPage: React.FC<HistoricalAnalyticsPageProps> = ({
  configuredLocations,
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedWeather, setSelectedWeather] = useState<string>('');
  const [selectedRoadType, setSelectedRoadType] = useState<string>('');

  const [summary, setSummary] = useState<HistoricalSummary | null>(null);
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Load summary distribution
  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getHistoricalSummary(selectedLocationId || undefined, 10.0);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load historical summary', err);
    }
  }, [selectedLocationId]);

  // Load paginated records
  const loadRecords = useCallback(async () => {
    try {
      const data = await api.getHistoricalRecords({
        locationId: selectedLocationId || undefined,
        severity: selectedSeverity || undefined,
        weather: selectedWeather || undefined,
        roadType: selectedRoadType || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setRecords(data.records);
      setTotalRecords(data.total);
    } catch (err) {
      console.error('Failed to load records', err);
    }
  }, [selectedLocationId, selectedSeverity, selectedWeather, selectedRoadType, page]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Calculate max hour count for SVG chart scaling
  const maxHourCount = summary
    ? Math.max(...summary.distributions.by_hour.map((h) => h.count), 1)
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Title Header */}
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
            Historical Accident Analytics & Trends
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Empirical incident patterns, temporal histograms, and roadway crash distributions across Hyderabad
          </p>
        </div>
      </div>

      {/* Dataset Provenance & Metadata Disclosure Banner */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          fontSize: '0.78rem',
          color: '#334155',
          lineHeight: 1.45,
        }}
      >
        <Info size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>Dataset Provenance Disclosure:</strong> {summary?.metadata.documentation_note}
          <div style={{ marginTop: '0.35rem', display: 'flex', gap: '1.25rem', color: '#64748b', fontSize: '0.72rem' }}>
            <span><strong>Scope:</strong> {summary?.metadata.geographical_scope}</span>
            <span><strong>Date Range:</strong> {summary?.metadata.date_range}</span>
            <span><strong>Benchmark Records:</strong> {summary?.metadata.total_records_dataset} incidents</span>
            <span><strong>Mode:</strong> Synthetic Verification Sample</span>
          </div>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '0.85rem 1.1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={14} /> Filter Dataset:
        </span>

        {/* Location Filter */}
        <select
          value={selectedLocationId}
          onChange={(e) => {
            setSelectedLocationId(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.78rem',
            background: '#ffffff',
          }}
        >
          <option value="">All Hyderabad Areas (City-wide)</option>
          {configuredLocations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              Near {loc.name}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={selectedSeverity}
          onChange={(e) => {
            setSelectedSeverity(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.78rem',
            background: '#ffffff',
          }}
        >
          <option value="">All Severities</option>
          <option value="Slight">Slight (Minor)</option>
          <option value="Serious">Serious</option>
          <option value="Fatal">Fatal</option>
        </select>

        {/* Weather Filter */}
        <select
          value={selectedWeather}
          onChange={(e) => {
            setSelectedWeather(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.78rem',
            background: '#ffffff',
          }}
        >
          <option value="">All Weather Conditions</option>
          <option value="Clear">Clear</option>
          <option value="Raining">Raining</option>
          <option value="Fog or Mist">Fog or Mist</option>
          <option value="Overcast">Overcast</option>
        </select>

        {/* Road Type Filter */}
        <select
          value={selectedRoadType}
          onChange={(e) => {
            setSelectedRoadType(e.target.value);
            setPage(0);
          }}
          style={{
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '0.78rem',
            background: '#ffffff',
          }}
        >
          <option value="">All Roadway Geometries</option>
          <option value="Junction">Junction</option>
          <option value="Arterial">Arterial</option>
          <option value="Flyover">Flyover</option>
          <option value="Roundabout">Roundabout</option>
        </select>

        {(selectedLocationId || selectedSeverity || selectedWeather || selectedRoadType) && (
          <button
            onClick={() => {
              setSelectedLocationId('');
              setSelectedSeverity('');
              setSelectedWeather('');
              setSelectedRoadType('');
              setPage(0);
            }}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '0.35rem 0.6rem',
              fontSize: '0.75rem',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Distribution Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '1.25rem' }}>
        {/* Hourly 24-Hour Distribution Bar Chart */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#2563eb" />
              <span>Crash Frequency by Time of Day (24-Hour Histogram)</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {summary?.metadata.total_records_analyzed || 0} incidents analyzed
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ flex: 1, minHeight: '190px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '1rem' }}>
            {summary?.distributions.by_hour.map((h) => {
              const heightPct = Math.max(6, Math.round((h.count / maxHourCount) * 100));
              const isPeakRush = (h.hour >= 8 && h.hour <= 11) || (h.hour >= 17 && h.hour <= 21);
              return (
                <div
                  key={h.hour}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                  title={`${h.hour}:00 - ${h.count} accidents (${isPeakRush ? 'Rush Hour' : 'Standard'})`}
                >
                  <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>{h.count}</span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: isPeakRush ? '#2563eb' : '#93c5fd',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.2s ease',
                    }}
                  />
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{h.hour}h</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.6rem', textAlign: 'center' }}>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>■</span> Peak Rush Hours (8-11h, 17-21h) • <span style={{ color: '#93c5fd', fontWeight: 700 }}>■</span> Standard / Night Hours
          </div>
        </div>

        {/* Severity & Road Type Distribution Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Severity Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>
              Severity Distribution
            </div>
            {summary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {Object.entries(summary.distributions.by_severity).map(([sev, cnt]) => {
                  const pct = Math.round((cnt / (summary.metadata.total_records_analyzed || 1)) * 100);
                  const isSevere = sev.toLowerCase().includes('serious') || sev.toLowerCase().includes('fatal');
                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 600, color: isSevere ? '#dc2626' : '#166534' }}>{sev}</span>
                        <span style={{ color: '#64748b' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isSevere ? '#ef4444' : '#22c55e' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Roadway Geometry Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.6rem' }}>
              Crash Distribution by Roadway Geometry
            </div>
            {summary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {Object.entries(summary.distributions.by_road_type).map(([rt, cnt]) => {
                  const pct = Math.round((cnt / (summary.metadata.total_records_analyzed || 1)) * 100);
                  return (
                    <div key={rt}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{rt}</span>
                        <span style={{ color: '#64748b' }}>{cnt} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filterable Records Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
              Historical Incident Records
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
              Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalRecords)} of {totalRecords} records
            </span>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.75rem', color: '#64748b', padding: '0 0.3rem' }}>
              Page {page + 1} of {Math.ceil(totalRecords / pageSize) || 1}
            </span>
            <button
              onClick={() => setPage((p) => ((p + 1) * pageSize < totalRecords ? p + 1 : p))}
              disabled={(page + 1) * pageSize >= totalRecords}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                cursor: (page + 1) * pageSize >= totalRecords ? 'not-allowed' : 'pointer',
                opacity: (page + 1) * pageSize >= totalRecords ? 0.5 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Coordinates</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Road Type</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Weather</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Surface</th>
                <th style={{ padding: '0.6rem 1rem', fontWeight: 600 }}>Lighting</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const isSerious = r.accident_severity.toLowerCase().includes('serious') || r.accident_severity.toLowerCase().includes('fatal');
                return (
                  <tr key={r.accident_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.55rem 1rem', fontWeight: 600, color: '#0f172a' }}>{r.accident_id}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#475569' }}>{r.date} {r.time}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#64748b' }}>{r.latitude}, {r.longitude}</td>
                    <td style={{ padding: '0.55rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: isSerious ? '#fee2e2' : '#dcfce7',
                          color: isSerious ? '#991b1b' : '#166534',
                        }}
                      >
                        {r.accident_severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 1rem', color: '#475569' }}>{r.road_type} ({r.speed_limit_kmh} km/h)</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#475569' }}>{r.weather_conditions}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#475569' }}>{r.road_surface_conditions}</td>
                    <td style={{ padding: '0.55rem 1rem', color: '#64748b' }}>{r.light_conditions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
