import { useQuery } from '@tanstack/react-query'
import { fetchDashboardKPI, fetchRevenueByMonth } from '../api/analytics'

export function useDashboardKPI() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: fetchDashboardKPI,
  })
}

export function useRevenueByMonth(months = 6) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', months],
    queryFn: () => fetchRevenueByMonth(months),
  })
}