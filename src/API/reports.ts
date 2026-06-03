import apiClient from '../utils/apiClient';
import type { RevenueReportData, TopServicesData, ApiResponse } from '../types/models';

/**
 * GET /reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getRevenueReport(
  startDate: string,
  endDate: string,
): Promise<RevenueReportData> {
  const { data } = await apiClient.get<ApiResponse<RevenueReportData>>(
    '/reports/revenue',
    { params: { startDate, endDate } },
  );
  return data.data!;
}

/**
 * GET /reports/top-services?limit=10
 */
export async function getTopServices(limit = 10): Promise<TopServicesData> {
  const { data } = await apiClient.get<ApiResponse<TopServicesData>>(
    '/reports/top-services',
    { params: { limit } },
  );
  return data.data!;
}