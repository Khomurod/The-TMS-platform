// lib/hooks/brokers.ts — TanStack Query hooks for broker directory

import { useQuery } from '@tanstack/react-query';
import { getBrokers } from '@/lib/api';

export interface BrokerItem {
  id: string;
  name: string;
  mc_number?: string;
  billing_address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BrokerListResponse {
  items: BrokerItem[];
  total: number;
  page: number;
  page_size: number;
}

export const useBrokers = (page = 1, pageSize = 20, search?: string) => {
  return useQuery<BrokerListResponse>({
    queryKey: ['brokers', page, pageSize, search],
    queryFn: () => getBrokers({ page, page_size: pageSize, search }),
    staleTime: 30_000,
  });
};
