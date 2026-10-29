/**
 * Reusable API client connecting to the FastAPI backend.
 */

import {
  LocationListResponse,
  TrafficOverviewResponse,
  WeatherData,
  TrafficFlowData,
  LocationIncidentsResponse,
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
}

export const api = new ApiService();
