// lib/types/loads.ts — mirrors backend LoadListItem / LoadResponse schemas

export interface LoadListItem {
  id: string;
  load_number: string;
  shipment_id?: string;
  broker_load_id?: string;
  status: string;
  base_rate?: number;
  total_rate?: number;
  created_at?: string;
  pickup_city?: string;
  pickup_date?: string;
  delivery_city?: string;
  delivery_date?: string;
  broker_name?: string;
  driver_name?: string;
  truck_number?: string;
  trip_count: number;
}

export interface LoadListResponse {
  items: LoadListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface StopResponse {
  id: string;
  stop_type: string;
  stop_sequence: number;
  facility_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  arrival_date?: string;
  departure_date?: string;
  notes?: string;
  trip_id?: string;
}

export interface AccessorialResponse {
  id: string;
  type: string;
  amount: number;
  description?: string;
}

export interface TripResponse {
  id: string;
  trip_number: string;
  sequence_number: number;
  status: string;
  driver_id?: string;
  truck_id?: string;
  trailer_id?: string;
  loaded_miles?: number;
  empty_miles?: number;
  driver_gross?: number;
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
}

export interface LoadResponse {
  id: string;
  load_number: string;
  shipment_id?: string;
  broker_load_id?: string;
  broker_id?: string;
  status: string;
  is_locked: boolean;
  base_rate?: number;
  total_miles?: number;
  total_rate?: number;
  contact_agent?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  stops: StopResponse[];
  accessorials: AccessorialResponse[];
  trips: TripResponse[];
}

// Status constants matching backend enum
export const LOAD_STATUSES = [
  'offer',
  'booked',
  'assigned',
  'dispatched',
  'in_transit',
  'delivered',
  'invoiced',
  'paid',
  'cancelled',
] as const;

export type LoadStatus = (typeof LOAD_STATUSES)[number];

export const STATUS_COLORS: Record<string, string> = {
  offer: 'bg-gray-500/20 text-gray-400',
  booked: 'bg-blue-500/20 text-blue-400',
  assigned: 'bg-indigo-500/20 text-indigo-400',
  dispatched: 'bg-purple-500/20 text-purple-400',
  in_transit: 'bg-amber-500/20 text-amber-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  invoiced: 'bg-cyan-500/20 text-cyan-400',
  paid: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
