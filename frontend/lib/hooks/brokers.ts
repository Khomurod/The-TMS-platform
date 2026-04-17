// lib/hooks/brokers.ts - TanStack Query hooks for broker directory

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteBroker, getBroker, getBrokers, updateBroker } from '@/lib/api';

export interface BrokerItem {
  id: string;
  name: string;
  mc_number?: string;
  dot_number?: string;
  billing_address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BrokerListResponse {
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

export const useBrokerDetail = (brokerId: string | null) => {
  return useQuery<BrokerItem>({
    queryKey: ['brokers', 'detail', brokerId],
    queryFn: () => getBroker(brokerId!),
    enabled: !!brokerId,
    staleTime: 10_000,
  });
};

export const useUpdateBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      brokerId,
      payload,
    }: {
      brokerId: string;
      payload: Record<string, unknown>;
    }) => updateBroker(brokerId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.invalidateQueries({ queryKey: ['brokers', 'detail', variables.brokerId] });
    },
  });
};

export const useDeleteBroker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brokerId: string) => deleteBroker(brokerId),
    onSuccess: (_, brokerId) => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] });
      queryClient.removeQueries({ queryKey: ['brokers', 'detail', brokerId] });
    },
  });
};
