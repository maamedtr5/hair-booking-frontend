import { useQuery } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';

export function useRevenueReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reportsApi.getRevenueReport(params.startDate, params.endDate),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useTopServicesReport(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'top-services', params],
    queryFn: () => reportsApi.getTopServices(params?.limit),
  });
}