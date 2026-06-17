import apiClient from './client'
import type { Client, ClientList } from '../types'

export interface ClientFilters {
  page?: number
  size?: number
  segment?: string
  search?: string
}

export async function fetchClients(filters: ClientFilters = {}): Promise<ClientList> {
  const params: Record<string, string | number> = {}
  if (filters.page) params.page = filters.page
  if (filters.size) params.size = filters.size
  if (filters.segment) params.segment = filters.segment
  if (filters.search) params.search = filters.search

  const { data } = await apiClient.get<ClientList>('/clients', { params })
  return data
}

export async function fetchClient(id: number): Promise<Client> {
  const { data } = await apiClient.get<Client>(`/clients/${id}`)
  return data
}

export async function createClient(
  client: Omit<Client, 'id' | 'bonus_points' | 'discount_percent' | 'total_spent' | 'is_active' | 'created_at'>,
): Promise<Client> {
  const { data } = await apiClient.post<Client>('/clients', client)
  return data
}

export async function updateClient(
  id: number,
  client: Partial<Omit<Client, 'id' | 'bonus_points' | 'discount_percent' | 'total_spent' | 'is_active' | 'created_at'>>,
): Promise<Client> {
  const { data } = await apiClient.patch<Client>(`/clients/${id}`, client)
  return data
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`)
}