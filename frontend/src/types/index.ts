export type UserRole = 'admin' | 'manager' | 'designer' | 'production'

export type ClientSegment = 'b2c' | 'b2b' | 'vip'

export type FurnitureType =
  | 'kitchen'
  | 'wardrobe'
  | 'bed'
  | 'table'
  | 'chair'
  | 'sofa'
  | 'hallway'
  | 'other'

export type OrderStatus =
  | 'inquiry'
  | 'measurement'
  | 'design'
  | 'production'
  | 'ready'
  | 'delivery'
  | 'assembly'
  | 'completed'
  | 'cancelled'

export type EventType = 'measurement' | 'delivery' | 'assembly'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Client {
  id: number
  full_name: string
  company_name?: string
  phone: string
  email?: string
  address?: string
  segment: ClientSegment
  is_active: boolean
  preferred_style?: string
  preferred_materials?: string
  notes?: string
  bonus_points: number
  discount_percent: number
  total_spent: number
  created_at: string
}

export interface ClientList {
  items: Client[]
  total: number
  page: number
  size: number
}

export interface OrderSpecifications {
  width_mm?: number
  height_mm?: number
  depth_mm?: number
  material?: string
  color?: string
  hardware?: string
  extra?: Record<string, unknown>
}

export interface OrderStatusHistory {
  from_status?: string
  to_status: string
  comment?: string
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  client_id: number
  manager_id: number
  furniture_type: string
  title: string
  description?: string
  price: number
  cost_price: number
  discount: number
  final_price: number
  margin: number
  specifications?: Record<string, unknown>
  measurement_date?: string
  production_deadline?: string
  delivery_date?: string
  delivery_address?: string
  assembly_date?: string
  completed_at?: string
  status: OrderStatus
  created_at: string
  updated_at: string
  status_history?: OrderStatusHistory[]
}

export interface OrderList {
  items: Order[]
  total: number
  page: number
  size: number
}

export interface PipelineStage {
  status: OrderStatus
  label: string
  count: number
  total_amount: number
  orders: Order[]
}

export interface DashboardKPI {
  revenue: { current: number; previous: number; delta_pct: number }
  orders: { current: number; previous: number; delta: number }
  conversion: number
  avg_check: number
  avg_margin: number
  clients_total: number
  active_by_status: Record<string, number>
}

export interface RevenuePoint {
  month: string
  label: string
  revenue: number
}

export interface ScheduleEvent {
  id: number
  event_type: string
  order_id?: number
  assigned_user_id?: number
  title: string
  address?: string
  scheduled_at: string
  duration_minutes: number
  is_completed: boolean
  notes?: string
}