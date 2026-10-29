import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Location,
  RiskAssessmentResponse,
  VideoAnalysisResult,
  WeatherData,
  TrafficFlowData,
} from '../types';
import {
  Video,
  CloudSun,
  Gauge,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  RefreshCw,
} from 'lucide-react';

interface RiskAnalysisPageProps {
  configuredLocations: Location[];
}

export const RiskAnalysisPage: React.FC<RiskAnalysisPageProps> = ({ configuredLocations }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialLocation = searchParams.get('location') || configuredLocations[0]?.id || 'hyd-hitech-city';
  const initialVideo = searchParams.get('video') || '';

  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocation);
  const [selectedVideoJobId, setSelectedVideoJobId] = useState<string>(initialVideo);

  const [videoJobs, setVideoJobs] = useState<VideoAnalysisResult[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [traffic, setTraffic] = useState<TrafficFlowData | null>(null);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch video jobs for location
  const loadVideoJobs = useCallback(async (locId: string) => {
    try {
      const jobs = await api.getVideoJobs(locId);
      setVideoJobs(jobs);
    } catch (err) {
      console.error('Failed to load video jobs', err);
    }
  }, []);

  // Fetch comprehensive risk assessment & separate input telemetry
  const loadEvaluation = useCallback(
    async (locId: string, videoId?: string, forceRefresh = false) => {
      if (forceRefresh) setIsRefreshing(true);

      try {
        const [riskResp, weatherResp, trafficResp] = await Promise.all([
          api.getLocationRisk(locId, videoId || undefined, forceRefresh),
          api.getLocationWeather(locId, forceRefresh),
          api.getLocationTraffic(locId, forceRefresh),
        ]);

        setRiskAssessment(riskResp);
        setWeather(weatherResp);
        setTraffic(trafficResp);
      } catch (err: any) {
        console.error('Failed to evaluate accident risk', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadVideoJobs(selectedLocationId);
    loadEvaluation(selectedLocationId, selectedVideoJobId);
    setSearchParams({ location: selectedLocationId, ...(selectedVideoJobId ? { video: selectedVideoJobId } : {}) });
  }, [selectedLocationId, selectedVideoJobId, loadVideoJobs, loadEvaluation, setSearchParams]);

  const selectedLocation = configuredLocations.find((l) => l.id === selectedLocationId) || configuredLocations[0];
  const activeVideoJob = videoJobs.find((j) => j.job_id === selectedVideoJobId) || null;

  const availability = riskAssessment?.input_availability || {
    video_analytics: selectedVideoJobId ? 'available' : 'missing',
    weather_telemetry: weather?.status === 'success' ? 'available' : 'degraded',
    live_traffic_flow: traffic?.status === 'success' ? 'available' : 'unconfigured',
    historical_benchmark: 'available',
  };

  const getStatusBadge = (status: string) => {
    if (status === 'available') {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <CheckCircle2 size={12} /> Available
        </span>
      );
    }
    if (status === 'unconfigured') {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <HelpCircle size={12} /> Unconfigured
        </span>
      );
    }
    if (status === 'location_mismatch') {
      return (
        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <AlertCircle size={12} /> Mismatched
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>
        Missing / Optional
      </span>
    );
  };

  const riskScore = riskAssessment?.risk_score;
  const riskLevel = riskAssessment?.risk_level || 'UNAVAILABLE';

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', badge: '#dc2626' };
      case 'HIGH':
        return { bg: '#ffedd5', border: '#fdba74', text: '#9a3412', badge: '#ea580c' };
      case 'MODERATE':
        return { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', badge: '#d97706' };
      case 'LOW':
        return { bg: '#dcfce7', border: '#86efac', text: '#166534', badge: '#16a34a' };
      default:
        return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', badge: '#64748b' };
    }
  };

  const riskStyle = getRiskColor(riskLevel);

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
            Multimodal Accident Risk Analysis
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.2rem 0 0' }}>
            Integrated synthesis of computer vision video flow, live Open-Meteo weather, TomTom telemetry, and historical crash patterns
          </p>
        </div>

        <button
          onClick={() => loadEvaluation(selectedLocationId, selectedVideoJobId, true)}
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
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>{isRefreshing ? 'Evaluating...' : 'Re-Evaluate Corridor'}</span>
        </button>
      </div>

      {/* Corridor & Video Source Selector Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Step 1: Select Location */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
            1. Monitored Hyderabad Corridor:
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              setSelectedVideoJobId('');
            }}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            {configuredLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.area_type || 'Corridor'}) • {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Link Video Analysis */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
            2. Attached Video Analysis (Optional):
          </label>
          <select
            value={selectedVideoJobId}
            onChange={(e) => setSelectedVideoJobId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#0f172a',
              background: '#ffffff',
            }}
          >
            <option value="">None (Evaluate with Live Weather & Network Traffic Only)</option>
            {videoJobs.map((j) => (
              <option key={j.job_id} value={j.job_id}>
                [{j.job_id}] {j.filename} ({j.counts.total_unique} veh, flow: {j.vehicle_flow_rate_per_min || 0} veh/min)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alignment & Methodological Notice */}
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          fontSize: '0.78rem',
          color: '#92400e',
          lineHeight: 1.45,
        }}
      >
        <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <strong>Feature Alignment Integrity:</strong> Video-derived features (vehicle flow, class counts, field-of-view density) are strictly associated with the video's recording location and observation time window. Live weather is retrieved for <em>{selectedLocation?.name}</em>. If live TomTom speed data is unconfigured, traffic flow is assigned a 0% weight rather than hallucinating fake speeds.
        </div>
      </div>

      {/* 4 Inputs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {/* Category 1: Video Analytics */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
              <Video size={16} /> 1. Video Analytics
            </span>
            {getStatusBadge(availability.video_analytics)}
          </div>

          {activeVideoJob ? (
            <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><strong>Flow Rate:</strong> {activeVideoJob.vehicle_flow_rate_per_min || 0} veh/min</div>
              <div><strong>Unique Tracked:</strong> {activeVideoJob.counts.total_unique} vehicles</div>
              <div><strong>FOV Density:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{activeVideoJob.density_estimate || 'N/A'}</span></div>
              <div><strong>Duration:</strong> {activeVideoJob.video_duration_sec}s</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                Cars: {activeVideoJob.counts.car} • Buses: {activeVideoJob.counts.bus} • Trucks: {activeVideoJob.counts.truck} • Bikes: {activeVideoJob.counts.motorcycle}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.5rem 0' }}>
              No video attached. Evaluation uses real-time corridor telemetry only.
            </div>
          )}
        </div>

        {/* Category 2: Live Weather */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
              <CloudSun size={16} /> 2. Live Weather
            </span>
            {getStatusBadge(availability.weather_telemetry)}
          </div>

          {weather && weather.status === 'success' ? (
            <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><strong>Condition:</strong> {weather.weather_description}</div>
              <div><strong>Temperature:</strong> {weather.temperature_c}°C</div>
              <div><strong>Precipitation:</strong> {weather.rain_mm ?? 0} mm</div>
              <div><strong>Wind Speed:</strong> {weather.wind_speed_kmh ?? 0} km/h</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                Surface: {weather.rain_mm && weather.rain_mm > 0 ? 'Wet' : 'Dry'} • Open-Meteo
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Weather telemetry unavailable</div>
          )}
        </div>

        {/* Category 3: Live Traffic Flow */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
              <Gauge size={16} /> 3. Live Traffic Flow
            </span>
            {getStatusBadge(availability.live_traffic_flow)}
          </div>

          {traffic && traffic.status === 'success' ? (
            <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div><strong>Current Speed:</strong> {traffic.current_speed_kmh} km/h</div>
              <div><strong>Free-Flow Speed:</strong> {traffic.free_flow_speed_kmh} km/h</div>
              <div><strong>Congestion Deficit:</strong> {Math.round((traffic.congestion_ratio || 0) * 100)}%</div>
              <div><strong>Delay:</strong> {traffic.delay_sec ?? 0}s</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                Source: TomTom Flow API
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#92400e', background: '#fffbeb', padding: '0.4rem', borderRadius: '4px' }}>
              TomTom key unconfigured. 0% traffic weight applied.
            </div>
          )}
        </div>

        {/* Category 4: Historical Patterns */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed' }}>
              <History size={16} /> 4. Historical Patterns
            </span>
            {getStatusBadge('available')}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div><strong>Corridor Geometry:</strong> {riskAssessment?.observed_inputs.road_type || selectedLocation?.area_type || 'Junction'}</div>
            <div><strong>Time Window:</strong> {riskAssessment?.observed_inputs.hour_of_day || new Date().getHours()}:00 IST</div>
            <div><strong>Rush Hour Status:</strong> {riskAssessment?.observed_inputs.is_rush_hour ? 'Peak Rush Hour' : 'Off-Peak'}</div>
            <div><strong>Night Conditions:</strong> {riskAssessment?.observed_inputs.is_night ? 'Night (Elevated risk)' : 'Daylight'}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
              Benchmark: Hyderabad Sample Crash Set
            </div>
          </div>
        </div>
      </div>

      {/* Model Output & Composite Risk Evaluation */}
      <div
        style={{
          background: riskStyle.bg,
          border: `1px solid ${riskStyle.border}`,
          borderRadius: '10px',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '260px minmax(0, 1fr)',
          gap: '1.5rem',
        }}
      >
        {/* Score Gauge */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Composite Accident Risk
          </span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: riskStyle.text, lineHeight: 1.1, margin: '0.5rem 0' }}>
            {riskScore !== null && riskScore !== undefined ? `${riskScore}` : 'N/A'}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>/100</span>
          </div>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: riskStyle.badge,
              color: 'white',
              letterSpacing: '0.04em',
            }}
          >
            {riskLevel} RISK TIER
          </span>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
            {riskAssessment?.model_status === 'ml_model_active'
              ? 'Multi-Factor Live Model Active'
              : 'Hybrid Baseline • Weather Only'}
          </div>
        </div>

        {/* Factor Breakdown & Transparency Disclosure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Contributing Risk Components
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0' }}>
              Formula weighting dynamically adapts based on live telemetry availability
            </p>
          </div>

          {/* Factor Progress Bars */}
          {riskAssessment?.contributing_factors && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Traffic Congestion</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                  {Math.round((riskAssessment.contributing_factors.congestion_factor || 0) * 100)}%
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Weather Factor</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                  {Math.round((riskAssessment.contributing_factors.weather_factor || 0) * 100)}%
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Temporal Rush/Night</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                  {Math.round((riskAssessment.contributing_factors.temporal_factor || 0) * 100)}%
                </div>
              </div>
              <div style={{ background: '#ffffff', padding: '0.65rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ML Severity Propensity</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.1rem' }}>
                  {riskAssessment.severity_probability ? `${Math.round(riskAssessment.severity_probability * 100)}%` : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Model Limitations Disclaimer */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              padding: '0.75rem 0.9rem',
              border: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#475569',
              lineHeight: 1.45,
            }}
          >
            <strong>Statistical Disclaimer & Methodology:</strong> {riskAssessment?.limitations_note}
          </div>
        </div>
      </div>
    </div>
  );
};
