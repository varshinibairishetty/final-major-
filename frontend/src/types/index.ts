/**
 * TypeScript definitions matching backend FastAPI schemas.
 */

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area_type?: string | null;
  description?: string | null;
}

export interface LocationListResponse {
  city: string;
  state: string;
  country: string;
  total: number;
  locations: Location[];
  note: string;
}

export interface WeatherData {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  precipitation_mm?: number | null;
  rain_mm?: number | null;
  weather_code?: number | null;
  weather_description: string;
  wind_speed_kmh?: number | null;
  visibility_meters?: number | null;
  source: string;
  status: 'success' | 'unavailable' | 'degraded';
  is_cached: boolean;
  error_message?: string | null;
}

export interface TrafficFlowData {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  current_speed_kmh?: number | null;
  free_flow_speed_kmh?: number | null;
  current_travel_time_sec?: number | null;
  free_flow_travel_time_sec?: number | null;
  delay_sec?: number | null;
  congestion_ratio?: number | null;
  confidence?: number | null;
  road_closure: boolean;
  road_category?: string | null;
  status: 'success' | 'unavailable' | 'unconfigured' | 'no_segment_found';
  is_cached: boolean;
  error_message?: string | null;
  data_source: string;
  limitation_note: string;
}

export interface TrafficIncident {
  id: string;
  provider_id: string;
  category: string;
  icon_category_code: number;
  description: string;
  severity: string;
  magnitude_of_delay?: number | null;
  delay_sec?: number | null;
  latitude: number;
  longitude: number;
  distance_km?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  is_confirmed_accident: boolean;
}

export interface LocationIncidentsResponse {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  search_radius_km: number;
  status: 'success' | 'unavailable' | 'unconfigured';
  incident_count?: number | null;
  incidents: TrafficIncident[];
  timestamp: string;
  is_cached: boolean;
  data_source: string;
  error_message?: string | null;
  matching_method: string;
}

export interface RiskFactors {
  congestion_factor: number;
  weather_factor: number;
  temporal_factor: number;
  road_geometry_factor: number;
}

export interface ObservedTelemetryInputs {
  current_speed_kmh?: number | null;
  free_flow_speed_kmh?: number | null;
  congestion_ratio?: number | null;
  weather_description: string;
  rain_mm?: number | null;
  road_type: string;
  hour_of_day: number;
  is_night: boolean;
  is_rush_hour: boolean;
}

export interface RiskAssessmentResponse {
  location_id: string;
  location_name: string;
  timestamp: string;
  risk_score?: number | null;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNAVAILABLE';
  predicted_severity_class?: string | null;
  severity_probability?: number | null;
  contributing_factors?: RiskFactors | null;
  observed_inputs: ObservedTelemetryInputs;
  model_status:
    | 'ml_model_active'
    | 'heuristic_baseline'
    | 'model_unavailable'
    | 'telemetry_unavailable'
    | 'inference_error'
    | 'unavailable';
  model_version: string;
  status: 'success' | 'partial' | 'unavailable';
  error_message?: string | null;
  limitations_note: string;
}

export interface LocationOverview {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  area_type?: string | null;
  weather: WeatherData;
  traffic_flow: TrafficFlowData;
  incidents: LocationIncidentsResponse;
  risk_assessment?: RiskAssessmentResponse | null;
  overall_status: 'healthy' | 'partially_degraded' | 'unavailable' | 'unconfigured';
}

export interface TrafficOverviewResponse {
  timestamp: string;
  city: string;
  total_locations: number;
  locations: LocationOverview[];
  sources_status: Record<string, string>;
}
