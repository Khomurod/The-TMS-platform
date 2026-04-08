// lib/hooks/accounting.ts — TanStack Query hooks for settlements

import { useQuery } from '@tanstack/react-query';
import { getSettlements, getSettlementDetail } from '@/lib/api';

export interface SettlementItem {
  id: string;
  driver_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  net_pay: number;
  status: string;
  driver_name?: string;
  load_count: number;
}

export interface SettlementLineItem {
  id: string;
  type: string; // load_pay | accessorial | deduction | bonus
  description?: string;
  amount: number;
  load_id?: string;
  trip_id?: string;
}

export interface SettlementDetail {
  id: string;
  driver_id: string;
  settlement_number: string;
  period_start: string;
  period_end: string;
  gross_pay: number;
  total_accessorials: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
  line_items: SettlementLineItem[];
  driver_name?: string;
  truck_number?: string;
}

interface SettlementListResponse {
  items: SettlementItem[];
  total: number;
  page: number;
  page_size: number;
}

export const useSettlements = (page = 1, pageSize = 20, status?: string) => {
  return useQuery<SettlementListResponse>({
    queryKey: ['settlements', page, pageSize, status],
    queryFn: () => getSettlements({ page, page_size: pageSize, status }),
    staleTime: 30_000,
  });
};

export const useSettlementDetail = (settlementId: string | null) => {
  return useQuery<SettlementDetail>({
    queryKey: ['settlements', 'detail', settlementId],
    queryFn: () => getSettlementDetail(settlementId!),
    enabled: !!settlementId,
    staleTime: 30_000,
  });
};
