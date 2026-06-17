import apiClient from './client'
import type { Order, OrderList, PipelineStage, OrderStatus } from '../types'

export interface OrderFilters {
  page?: number
  size?: number
  status?: string
  client_id?: number
  manager_id?: number
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<OrderList> {
  const params: Record<string, string | number> = {}
  if (filters.page) params.page = filters.page
  if (filters.size) params.size = filters.size
  if (filters.status) params.status = filters.status
  if (filters.client_id) params.client_id = filters.client_id
  if (filters.manager_id) params.manager_id = filters.manager_id

  const { data } = await apiClient.get<OrderList>('/orders', { params })
  return data
}

export async function fetchOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`)
  return data
}

export async function createOrder(
  order: {
    client_id: number
    furniture_type: string
    title: string
    description?: string
    price?: number
    cost_price?: number
    discount?: number
    specifications?: Record<string, unknown>
    measurement_date?: string
    production_deadline?: string
    delivery_date?: string
    delivery_address?: string
  },
): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', order)
  return data
}

export async function updateOrder(
  id: number,
  order: Partial<{
    title: string
    description: string
    price: number
    cost_price: number
    discount: number
    specifications: Record<string, unknown>
    measurement_date: string
    production_deadline: string
    delivery_date: string
    assembly_date: string
    delivery_address: string
  }>,
): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, order)
  return data
}

export async function changeOrderStatus(
  id: number,
  status: OrderStatus,
  comment?: string,
): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${id}/status`, { status, comment })
  return data
}

export async function fetchPipeline(): Promise<PipelineStage[]> {
  const { data } = await apiClient.get<PipelineStage[]>('/orders/pipeline')
  return data
}