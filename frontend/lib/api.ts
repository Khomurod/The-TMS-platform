/**
 * API client — Axios wrapper with JWT Bearer token injection.
 */

import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Request Interceptor — Attach JWT ────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptor — Handle 401 & Auto-Refresh ────────────
// Singleton refresh promise to prevent concurrent token refreshes
let refreshPromise: Promise<void> | null = null;

async function performTokenRefresh(): Promise<void> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token");
  }
  const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
    refresh_token: refreshToken,
  });
  const { access_token, refresh_token: newRefresh } = res.data;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", newRefresh);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window === "undefined") {
        return Promise.reject(error);
      }

      // Use a single refresh promise to avoid concurrent refreshes
      if (!refreshPromise) {
        refreshPromise = performTokenRefresh();
      }

      try {
        await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
