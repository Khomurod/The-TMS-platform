// lib/hooks/loads.ts — TanStack Query hooks for load board data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLiveLoads,
  getUpcomingLoads,
  getCompletedLoads,
  getLoadDetail,
  updateLoad,
  assignTrip,
  advanceLoadStatus,
  getLoads,
  deleteLoad,
} from '@/lib/api';
import type { LoadListResponse, LoadResponse } from '@/lib/types/loads';

export const useLiveLoads = (page = 1, pageSize = 20) => {
  return useQuery<LoadListResponse>({
    queryKey: ['loads', 'live', page, pageSize],
    queryFn: () => getLiveLoads(page, pageSize),
    staleTime: 15_000,
  });
};

export const useUpcomingLoads = (page = 1, pageSize = 20) => {
  return useQuery<LoadListResponse>({
    queryKey: ['loads', 'upcoming', page, pageSize],
    queryFn: () => getUpcomingLoads(page, pageSize),
    staleTime: 15_000,
  });
};

export const useCompletedLoads = (page = 1, pageSize = 20) => {
  return useQuery<LoadListResponse>({
    queryKey: ['loads', 'completed', page, pageSize],
    queryFn: () => getCompletedLoads(page, pageSize),
    staleTime: 30_000,
  });
};

export const useAllLoads = (page = 1, pageSize = 20) => {
  return useQuery<LoadListResponse>({
    queryKey: ['loads', 'all', page, pageSize],
    queryFn: () => getLoads(page, pageSize),
    staleTime: 15_000,
  });
};

export const useLoadDetail = (loadId: string | null) => {
  return useQuery<LoadResponse>({
    queryKey: ['loads', 'detail', loadId],
    queryFn: () => getLoadDetail(loadId!),
    enabled: !!loadId,
    staleTime: 10_000,
  });
};

export const useAdvanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loadId, status }: { loadId: string; status: string }) =>
      advanceLoadStatus(loadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateLoad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loadId, payload }: { loadId: string; payload: Record<string, unknown> }) =>
      updateLoad(loadId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['loads', 'detail', variables.loadId] });
    },
  });
};

export const useAssignTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loadId,
      tripId,
      payload,
    }: {
      loadId: string;
      tripId: string;
      payload: {
        driver_id?: string;
        truck_id?: string;
        trailer_id?: string;
        loaded_miles?: number;
        empty_miles?: number;
        driver_gross?: number;
      };
    }) => assignTrip(loadId, tripId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['loads', 'detail', variables.loadId] });
    },
  });
};

export const useDeleteLoad = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loadId: string) => deleteLoad(loadId),
    onSuccess: (_, loadId) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['loads', 'detail', loadId] });
    },
  });
};
