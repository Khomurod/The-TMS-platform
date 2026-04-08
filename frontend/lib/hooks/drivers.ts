// lib/hooks/drivers.ts — TanStack Query hooks for driver management

import { useQuery } from '@tanstack/react-query';
import { getDrivers, getDriverDetail, getDriverCompliance } from '@/lib/api';

interface DriverListResponse {
  items: DriverItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface DriverItem {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  employment_type: string;
  cdl_number?: string;
  cdl_expiry_date?: string;
  medical_card_expiry_date?: string;
  status: string;
  is_active: boolean;
  pay_rate_type?: string;
  pay_rate_value?: number;
}

export interface DriverDetail {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  employment_type: string;
  cdl_number?: string;
  cdl_class?: string;
  cdl_expiry_date?: string;
  medical_card_expiry_date?: string;
  experience_years?: number;
  pay_rate_type?: string;
  pay_rate_value?: number;
  payment_tariff_type?: string;
  payment_tariff_value?: number;
  tax_classification?: string;
  use_company_defaults: boolean;
  status: string;
  is_active: boolean;
  hire_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComplianceViolation {
  field: string;
  severity: string;
  message: string;
}

export interface ComplianceResult {
  driver_id: string;
  driver_name: string;
  urgency: string;
  violations: ComplianceViolation[];
}

export const useDrivers = (page = 1, pageSize = 20, search?: string, status?: string) => {
  return useQuery<DriverListResponse>({
    queryKey: ['drivers', page, pageSize, search, status],
    queryFn: () => getDrivers({ page, page_size: pageSize, search, status }),
    staleTime: 30_000,
  });
};

export const useDriverDetail = (driverId: string | null) => {
  return useQuery<DriverDetail>({
    queryKey: ['drivers', 'detail', driverId],
    queryFn: () => getDriverDetail(driverId!),
    enabled: !!driverId,
    staleTime: 30_000,
  });
};

export const useDriverCompliance = (driverId: string | null) => {
  return useQuery<ComplianceResult>({
    queryKey: ['drivers', 'compliance', driverId],
    queryFn: () => getDriverCompliance(driverId!),
    enabled: !!driverId,
    staleTime: 30_000,
  });
};
