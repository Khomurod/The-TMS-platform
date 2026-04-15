/**
 * API Client — Axios instance with JWT interceptors and automatic token refresh.
 *
 * Maps to the FastAPI backend base URL (default: http://localhost:8000/api/v1).
 * All requests automatically attach the access_token from the auth store.
 * On 401, the interceptor attempts a silent refresh using the refresh_token.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const normalizeApiBaseUrl = (raw?: string): string => {
  const fallback = "http://localhost:8000/api/v1";
  const value = (raw || "").trim();
  if (!value) return fallback;

  // Guardrail: some environments set the API host without /api/v1.
  if (value.endsWith("/api/v1")) return value;
  if (value.endsWith("/api/v1/")) return value.slice(0, -1);
  if (value.endsWith("/api")) return `${value}/v1`;
  if (value.endsWith("/api/")) return `${value}v1`;
  return `${value.replace(/\/+$/, "")}/api/v1`;
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true, // Audit fix #7: Send httpOnly cookies with every request
});

// ── Request Interceptor — attach access token ────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptor — handle 401 with refresh ───────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Determine if this is a recoverable auth failure:
    // 1. Explicit 401 from the backend, OR
    // 2. Network error with no response (browser hid the 401 because CORS
    //    headers were missing — common when TenantMiddleware short-circuits)
    const is401 = error.response?.status === 401;
    const isCorsBlocked =
      !error.response && error.message?.includes("Network Error");
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");
    const shouldAttemptRefresh =
      (is401 || isCorsBlocked) &&
      !originalRequest?._retry &&
      !isAuthEndpoint;

    if (shouldAttemptRefresh) {
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = data.access_token;
        localStorage.setItem("access_token", newAccessToken);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);

        // Clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Dashboard endpoint helpers
export const getKpis = async () => {
  const { data } = await api.get('/dashboard/kpis');
  return data;
};

export const getComplianceAlerts = async () => {
  const { data } = await api.get('/dashboard/compliance-alerts');
  return data;
};

export const getFleetStatus = async () => {
  const { data } = await api.get('/dashboard/fleet-status');
  return data;
};

export const getRecentEvents = async () => {
  const { data } = await api.get('/dashboard/recent-events');
  return data;
};

// ── Loads endpoint helpers ──────────────────────────────────────

export const getLoads = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const { data } = await api.get('/loads', { params });
  return data;
};

export const getLiveLoads = async (page = 1, pageSize = 20) => {
  const { data } = await api.get('/loads/live', { params: { page, page_size: pageSize } });
  return data;
};

export const getUpcomingLoads = async (page = 1, pageSize = 20) => {
  const { data } = await api.get('/loads/upcoming', { params: { page, page_size: pageSize } });
  return data;
};

export const getCompletedLoads = async (page = 1, pageSize = 20) => {
  const { data } = await api.get('/loads/completed', { params: { page, page_size: pageSize } });
  return data;
};

export const getLoadDetail = async (loadId: string) => {
  const { data } = await api.get(`/loads/${loadId}`);
  return data;
};

export const updateLoad = async (loadId: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/loads/${loadId}`, payload);
  return data;
};

export const advanceLoadStatus = async (loadId: string, status: string) => {
  const { data } = await api.patch(`/loads/${loadId}/status`, { status });
  return data;
};

export const dispatchLoad = async (loadId: string, payload: { driver_id: string; truck_id: string; trailer_id?: string }) => {
  const { data } = await api.post(`/loads/${loadId}/dispatch`, payload);
  return data;
};

// ── Available resources (for dispatch) ──────────────────────────

export const getAvailableDrivers = async () => {
  const { data } = await api.get('/drivers/available');
  return data;
};

export const getAvailableTrucks = async () => {
  const { data } = await api.get('/fleet/trucks/available');
  return data;
};

export const getAvailableTrailers = async () => {
  const { data } = await api.get('/fleet/trailers/available');
  return data;
};

export const getDriverCompliance = async (driverId: string) => {
  const { data } = await api.get(`/drivers/${driverId}/compliance`);
  return data;
};

// ── Drivers endpoint helpers ────────────────────────────────────

export const getDrivers = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  employment_type?: string;
}) => {
  const { data } = await api.get('/drivers', { params });
  return data;
};

export const getDriverDetail = async (driverId: string) => {
  const { data } = await api.get(`/drivers/${driverId}`);
  return data;
};

export const createDriver = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/drivers', payload);
  return data;
};

export const updateDriver = async (driverId: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/drivers/${driverId}`, payload);
  return data;
};

// ── Fleet endpoint helpers ──────────────────────────────────────

export const getTrucks = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  const { data } = await api.get('/fleet/trucks', { params });
  return data;
};

export const getTrailers = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  const { data } = await api.get('/fleet/trailers', { params });
  return data;
};

export const createTruck = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/fleet/trucks', payload);
  return data;
};

export const createTrailer = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/fleet/trailers', payload);
  return data;
};

export const getTruckDetail = async (truckId: string) => {
  const { data } = await api.get(`/fleet/trucks/${truckId}`);
  return data;
};

export const getTrailerDetail = async (trailerId: string) => {
  const { data } = await api.get(`/fleet/trailers/${trailerId}`);
  return data;
};

// ── Accounting endpoint helpers ─────────────────────────────────

export const getSettlements = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  driver_id?: string;
}) => {
  const { data } = await api.get('/accounting/settlements', { params });
  return data;
};

export const getSettlementDetail = async (settlementId: string) => {
  const { data } = await api.get(`/accounting/settlements/${settlementId}`);
  return data;
};

export const generateSettlement = async (payload: { driver_id: string; period_start: string; period_end: string }) => {
  const { data } = await api.post('/accounting/settlements/generate', payload);
  return data;
};

export const postSettlement = async (settlementId: string) => {
  const { data } = await api.patch(`/accounting/settlements/${settlementId}/post`);
  return data;
};

export const undoPostSettlement = async (settlementId: string) => {
  const { data } = await api.patch(`/accounting/settlements/${settlementId}/undo`);
  return data;
};

export const paySettlement = async (settlementId: string) => {
  const { data } = await api.patch(`/accounting/settlements/${settlementId}/pay`);
  return data;
};

export const downloadSettlementPdf = async (settlementId: string) => {
  const response = await api.get(`/accounting/settlements/${settlementId}/pdf`, { responseType: 'blob' });
  return response.data;
};

// ── Settings endpoint helpers ───────────────────────────────────

export const getCompanyProfile = async () => {
  const { data } = await api.get('/settings/company');
  return data;
};

export const updateCompanyProfile = async (payload: Record<string, unknown>) => {
  const { data } = await api.put('/settings/company', payload);
  return data;
};

export const getCompanyUsers = async () => {
  const { data } = await api.get('/settings/users');
  return data;
};

// ── Broker endpoint helpers ─────────────────────────────────────

export const getBrokers = async (params?: { page?: number; page_size?: number; search?: string }) => {
  const { data } = await api.get('/brokers', { params });
  return data;
};

export const searchBrokers = async (q: string) => {
  const { data } = await api.get('/brokers/search', { params: { q } });
  return data;
};

export const createBroker = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/brokers', payload);
  return data;
};

// ── Load creation ───────────────────────────────────────────────

export const createLoad = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/loads', payload);
  return data;
};

// ── User management helpers ─────────────────────────────────────

export const createUser = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/settings/users', payload);
  return data;
};

export const updateUser = async (userId: string, payload: Record<string, unknown>) => {
  const { data } = await api.put(`/settings/users/${userId}`, payload);
  return data;
};

// ── Invoice helpers ─────────────────────────────────────────────

export const generateInvoice = async (loadId: string) => {
  const { data } = await api.post(`/accounting/loads/${loadId}/invoice`);
  return data;
};

// ── Super Admin helpers ─────────────────────────────────────────

export const getAdminCompanies = async () => {
  const { data } = await api.get('/admin/companies');
  return data;
};

export const createTenant = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/admin/companies', payload);
  return data;
};

export const toggleCompanyStatus = async (companyId: string) => {
  const { data } = await api.patch(`/admin/companies/${companyId}`);
  return data;
};

export const impersonateCompany = async (companyId: string) => {
  const { data } = await api.post(`/admin/impersonate/${companyId}`);
  return data;
};
