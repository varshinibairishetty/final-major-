/**
 * Reusable API client connecting to the FastAPI backend.
 */

import {
  LocationListResponse,
  TrafficOverviewResponse,
  WeatherData,
  TrafficFlowData,
  LocationIncidentsResponse,
  RiskAssessmentResponse,
  VideoAnalysisResult,
  VideoUploadResponse,
  HistoricalSummary,
  HistoricalRecord,
} from '../types';

// Read API base URL from Vite environment variable with a resilient fallback
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
// Ensure no trailing slash
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.detail) {
            errorMessage = errorBody.detail;
          }
        } catch {
          // Response body was not JSON
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          `Unable to reach backend service at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`
        );
      }
      throw err;
    }
  }

  /**
   * Health check verifying backend connection.
   */
  async checkHealth(): Promise<{ status: string; environment?: string; version?: string }> {
    return this.request<{ status: string; environment?: string; version?: string }>('/health');
  }

  /**
   * Fetches the authoritative configured Hyderabad monitoring locations.
   */
  async getLocations(): Promise<LocationListResponse> {
    return this.request<LocationListResponse>('/locations');
  }

  /**
   * Fetches the comprehensive city-wide traffic and weather overview.
   */
  async getTrafficOverview(forceRefresh = false): Promise<TrafficOverviewResponse> {
    const query = forceRefresh ? '?force_refresh=true' : '';
    return this.request<TrafficOverviewResponse>(`/traffic-overview${query}`);
  }

  /**
   * Fetches current weather for a specific location.
   */
  async getLocationWeather(locationId: string, forceRefresh = false): Promise<WeatherData> {
    const query = forceRefresh ? '?force_refresh=true' : '';
    return this.request<WeatherData>(`/locations/${encodeURIComponent(locationId)}/weather${query}`);
  }

  /**
   * Fetches traffic flow and congestion for a specific location.
   */
  async getLocationTraffic(locationId: string, forceRefresh = false): Promise<TrafficFlowData> {
    const query = forceRefresh ? '?force_refresh=true' : '';
    return this.request<TrafficFlowData>(`/locations/${encodeURIComponent(locationId)}/traffic${query}`);
  }

  /**
   * Fetches provider-reported incidents for a specific location.
   */
  async getLocationIncidents(
    locationId: string,
    radiusKm = 3.0,
    forceRefresh = false
  ): Promise<LocationIncidentsResponse> {
    const params = new URLSearchParams({
      radius_km: radiusKm.toString(),
      ...(forceRefresh ? { force_refresh: 'true' } : {}),
    });
    return this.request<LocationIncidentsResponse>(
      `/locations/${encodeURIComponent(locationId)}/incidents?${params.toString()}`
    );
  }

  /**
   * Fetches statistical accident risk assessment and ML severity propensity for a location.
   */
  async getLocationRisk(
    locationId: string,
    videoJobId?: string,
    forceRefresh = false
  ): Promise<RiskAssessmentResponse> {
    const params = new URLSearchParams();
    if (videoJobId) params.append('video_job_id', videoJobId);
    if (forceRefresh) params.append('force_refresh', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<RiskAssessmentResponse>(
      `/locations/${encodeURIComponent(locationId)}/risk${queryString}`
    );
  }

  /**
   * Uploads recorded traffic video file and initiates YOLO detection.
   */
  async uploadTrafficVideo(file: File, locationId: string): Promise<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('location_id', locationId);

    const url = `${API_BASE_URL}/videos/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody.detail) errorMessage = errorBody.detail;
      } catch {}
      throw new Error(errorMessage);
    }

    return (await response.json()) as VideoUploadResponse;
  }

  /**
   * Lists video analytics jobs with optional location filter.
   */
  async getVideoJobs(locationId?: string): Promise<VideoAnalysisResult[]> {
    const query = locationId ? `?location_id=${encodeURIComponent(locationId)}` : '';
    return this.request<VideoAnalysisResult[]>(`/videos/jobs${query}`);
  }

  /**
   * Gets single video analysis status, vehicle counts, and flow rates.
   */
  async getVideoJob(jobId: string): Promise<VideoAnalysisResult> {
    return this.request<VideoAnalysisResult>(`/videos/${encodeURIComponent(jobId)}`);
  }

  /**
   * Retrieves historical accident distribution summary and time patterns.
   */
  async getHistoricalSummary(locationId?: string, radiusKm = 5.0): Promise<HistoricalSummary> {
    const params = new URLSearchParams();
    if (locationId) {
      params.append('location_id', locationId);
      params.append('radius_km', radiusKm.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<HistoricalSummary>(`/historical/summary${queryString}`);
  }

  /**
   * Retrieves paginated historical accident records with optional filters.
   */
  async getHistoricalRecords(options?: {
    locationId?: string;
    severity?: string;
    weather?: string;
    roadType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; offset: number; limit: number; records: HistoricalRecord[] }> {
    const params = new URLSearchParams();
    if (options?.locationId) params.append('location_id', options.locationId);
    if (options?.severity) params.append('severity', options.severity);
    if (options?.weather) params.append('weather', options.weather);
    if (options?.roadType) params.append('road_type', options.roadType);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ total: number; offset: number; limit: number; records: HistoricalRecord[] }>(
      `/historical/records${queryString}`
    );
  }
}

export const api = new ApiService();
