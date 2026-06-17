import apiClient from './client'
import type { ScheduleEvent } from '../types'

export interface EventFilters {
  date_from: string
  date_to: string
}

export async function fetchEvents(filters: EventFilters): Promise<ScheduleEvent[]> {
  const { data } = await apiClient.get<ScheduleEvent[]>('/schedule', { params: filters })
  return data
}

export async function createEvent(
  event: {
    event_type: string
    title: string
    order_id?: number
    assigned_user_id?: number
    address?: string
    scheduled_at: string
    duration_minutes?: number
    notes?: string
  },
): Promise<ScheduleEvent> {
  const { data } = await apiClient.post<ScheduleEvent>('/schedule', event)
  return data
}

export async function completeEvent(id: number): Promise<ScheduleEvent> {
  const { data } = await apiClient.patch<ScheduleEvent>(`/schedule/${id}/complete`)
  return data
}