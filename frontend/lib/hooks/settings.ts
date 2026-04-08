// lib/hooks/settings.ts — TanStack Query hooks for company settings

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanyProfile, updateCompanyProfile, getCompanyUsers } from '@/lib/api';

export interface CompanyProfile {
  id: string;
  name: string;
  mc_number?: string;
  dot_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
}

interface UserListResponse {
  items: CompanyUser[];
  total: number;
}

export const useCompanyProfile = () => {
  return useQuery<CompanyProfile>({
    queryKey: ['settings', 'company'],
    queryFn: getCompanyProfile,
    staleTime: 60_000,
  });
};

export const useUpdateCompanyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateCompanyProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
    },
  });
};

export const useCompanyUsers = () => {
  return useQuery<UserListResponse>({
    queryKey: ['settings', 'users'],
    queryFn: getCompanyUsers,
    staleTime: 30_000,
  });
};
