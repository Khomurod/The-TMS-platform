// lib/hooks/dashboard.ts

import { useQuery } from '@tanstack/react-query';
import { getKpis, getComplianceAlerts, getFleetStatus, getRecentEvents } from '@/lib/api';
import { KpisResponse, ComplianceAlertsResponse, FleetStatusResponse, RecentEventsResponse } from '@/lib/types/dashboard';

export const useKpis = () => {
  return useQuery<KpisResponse>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: getKpis,
    staleTime: 60_000,
    retry: 1,
  });
};

export const useComplianceAlerts = () => {
  return useQuery<ComplianceAlertsResponse>({
    queryKey: ['dashboard', 'compliance-alerts'],
    queryFn: getComplianceAlerts,
    staleTime: 30_000,
    retry: 1,
  });
};

export const useFleetStatus = () => {
  return useQuery<FleetStatusResponse>({
    queryKey: ['dashboard', 'fleet-status'],
    queryFn: getFleetStatus,
    staleTime: 30_000,
    retry: 1,
  });
};

export const useRecentEvents = () => {
  return useQuery<RecentEventsResponse>({
    queryKey: ['dashboard', 'recent-events'],
    queryFn: getRecentEvents,
    staleTime: 30_000,
    retry: 1,
  });
};
