import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  deleteClient,
  type ClientFilters,
} from '../api/clients'
import type { Client } from '../types'

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => fetchClients(filters),
  })
}

export function useClient(id: number | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id!),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<Client, 'id' | 'bonus_points' | 'discount_percent' | 'total_spent' | 'is_active' | 'created_at'>>) =>
      updateClient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}