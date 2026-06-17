import apiClient from './client'
import type { DashboardKPI, RevenuePoint } from '../types'

export async function fetchDashboardKPI(): Promise<DashboardKPI> {
  const { data } = await apiClient.get<DashboardKPI>('/analytics/dashboard')
  return data
}

export async function fetchRevenueByMonth(months = 6): Promise<RevenuePoint[]> {
  const { data } = await apiClient.get<RevenuePoint[]>('/analytics/revenue-by-month', {
    params: { months },
  })
  return data
}

export async function downloadReport(type: 'pdf' | 'excel', dateFrom: string, dateTo: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/analytics/report/${type}`, {
    params: { date_from: dateFrom, date_to: dateTo },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  const ext = type === 'pdf' ? 'pdf' : 'xlsx'
  a.download = `report_${dateFrom}_${dateTo}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}