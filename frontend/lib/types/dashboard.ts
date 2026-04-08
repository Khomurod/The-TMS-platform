// lib/types/dashboard.ts

export interface KpisResponse {
  gross_revenue: number;
  avg_rpm: number;
  active_loads: number;
  upcoming_loads?: number;
  fleet_effectiveness?: number | string;
  fleet_efficiency?: number;
  // Trend percentages (optional — mock provides them)
  revenue_trend?: number;
  rpm_trend?: number;
  loads_trend?: number;
  efficiency_trend?: number;
}

export interface AlertItem {
  id?: string;
  entity_id?: string;
  entity_name?: string;
  driver_name?: string;
  type: string;
  description?: string;
  severity?: string;
  expiry_date?: string;
}

export interface ComplianceAlertsResponse {
  alerts?: AlertItem[];
  items?: AlertItem[];
  critical_count: number;
  total?: number;
}

export interface FleetStatusResponse {
  available: number;
  loaded?: number;
  in_use?: number;
  in_shop?: number;
  maintenance?: number;
  out_of_service?: number;
  utilization_rate?: number;
}

export interface RecentEvent {
  id?: string;
  load_id?: string;
  load_number?: string;
  event_type?: string;
  status?: string;
  description: string;
  driver_name?: string | null;
  timestamp?: string | null;
  color?: 'red' | 'green' | 'blue' | string;
}

export interface RecentEventsResponse {
  events?: RecentEvent[];
  items?: RecentEvent[];
}

export interface ComplianceResult {
  urgency?: string;
  compliant?: boolean;
  violations?: Array<{ severity?: string; message?: string }>;
  documents?: Array<{
    doc_type: string;
    status: string;
    expiry_date?: string | null;
  }>;
}
