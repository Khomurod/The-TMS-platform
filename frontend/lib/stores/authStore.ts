/**
 * Auth Store — Zustand global state for authentication.
 *
 * Maps to backend auth/router.py endpoints:
 *   POST /auth/login    → login()
 *   POST /auth/register → register()
 *   POST /auth/logout   → logout()
 *   GET  /auth/me       → fetchProfile()
 *   POST /auth/refresh  → handled by api.ts interceptor
 *
 * User roles map to UserRole enum:
 *   super_admin | company_admin | dispatcher | accountant
 */

import { create } from "zustand";
import api from "@/lib/api";

export type UserRole =
  | "super_admin"
  | "company_admin"
  | "dispatcher"
  | "accountant";

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  company_id: string | null;
  company_name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  hydrate: () => Promise<void>;
}

interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  mc_number?: string;
  dot_number?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string, rememberMe?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (rememberMe) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        sessionStorage.removeItem("access_token");
      } else {
        sessionStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token); // Refresh token usually stays in local
        localStorage.removeItem("access_token");
      }
      await get().fetchProfile();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Login failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", payload);
      // Backend returns { user, tokens: { access_token, refresh_token } }
      const tokens = data.tokens || data;
      localStorage.setItem("access_token", tokens.access_token);
      localStorage.setItem("refresh_token", tokens.refresh_token);
      await get().fetchProfile();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Ignore logout API errors — clear local state regardless
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({
        user: {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          company_id: data.company_id,
          company_name: data.company_name,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("access_token");
    if (token) {
      await get().fetchProfile();
    } else {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
