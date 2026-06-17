import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  changeOrderStatus,
  fetchPipeline,
  type OrderFilters,
} from '../api/orders'
import type { OrderStatus } from '../types'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  })
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  })
}

export function usePipeline() {
  return useQuery({
    queryKey: ['pipeline'],
    queryFn: fetchPipeline,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrder(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateOrder>[1]) => updateOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}

export function useChangeOrderStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ status, comment }: { status: OrderStatus; comment?: string }) =>
      changeOrderStatus(id, status, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
    },
  })
}