// lib/hooks/admin.ts — TanStack Query hooks for Super Admin portal

import { useQuery } from '@tanstack/react-query';
import { getAdminCompanies } from '@/lib/api';

export interface AdminCompany {
  id: string;
  name: string;
  mc_number?: string;
  dot_number?: string;
  is_active: boolean;
}

export const useAdminCompanies = () => {
  return useQuery<AdminCompany[]>({
    queryKey: ['admin', 'companies'],
    queryFn: () => getAdminCompanies(),
    staleTime: 30_000,
  });
};
