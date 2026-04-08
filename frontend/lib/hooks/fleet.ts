import { useQuery } from '@tanstack/react-query';
import { getTrucks, getTrailers, getTruckDetail, getTrailerDetail } from '@/lib/api';

export interface TruckItem {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  ownership_type?: string;
  dot_inspection_expiry?: string;
  status: string;
  is_active: boolean;
}

export interface TruckDetail {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  ownership_type?: string;
  dot_inspection_date?: string;
  dot_inspection_expiry?: string;
  status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TrailerItem {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  trailer_type?: string;
  ownership_type?: string;
  dot_inspection_expiry?: string;
  status: string;
  is_active: boolean;
}

export interface TrailerDetail {
  id: string;
  unit_number: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  trailer_type?: string;
  ownership_type?: string;
  dot_inspection_date?: string;
  dot_inspection_expiry?: string;
  status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TruckListResponse {
  items: TruckItem[];
  total: number;
  page: number;
  page_size: number;
}

interface TrailerListResponse {
  items: TrailerItem[];
  total: number;
  page: number;
  page_size: number;
}

export const useTrucks = (page = 1, pageSize = 20, status?: string) => {
  return useQuery<TruckListResponse>({
    queryKey: ['fleet', 'trucks', page, pageSize, status],
    queryFn: () => getTrucks({ page, page_size: pageSize, status }),
    staleTime: 30_000,
  });
};

export const useTrailers = (page = 1, pageSize = 20, status?: string) => {
  return useQuery<TrailerListResponse>({
    queryKey: ['fleet', 'trailers', page, pageSize, status],
    queryFn: () => getTrailers({ page, page_size: pageSize, status }),
    staleTime: 30_000,
  });
};

export const useTruckDetail = (truckId: string | null) => {
  return useQuery<TruckDetail>({
    queryKey: ['fleet', 'trucks', 'detail', truckId],
    queryFn: () => getTruckDetail(truckId!),
    enabled: !!truckId,
    staleTime: 30_000,
  });
};

export const useTrailerDetail = (trailerId: string | null) => {
  return useQuery<TrailerDetail>({
    queryKey: ['fleet', 'trailers', 'detail', trailerId],
    queryFn: () => getTrailerDetail(trailerId!),
    enabled: !!trailerId,
    staleTime: 30_000,
  });
};
