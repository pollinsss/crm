import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, DollarSign, Users } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePipeline } from '../hooks/useOrders'
import { changeOrderStatus } from '../api/orders'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import type { Order, OrderStatus } from '../types'

const pipelineStatuses: OrderStatus[] = [
  'inquiry',
  'measurement',
  'design',
  'production',
  'ready',
  'delivery',
  'assembly',
]

const statusLabels: Record<OrderStatus, string> = {
  inquiry: 'Заявка',
  measurement: 'Замер',
  design: 'Дизайн',
  production: 'Производство',
  ready: 'Готов',
  delivery: 'Доставка',
  assembly: 'Сборка',
  completed: 'Выполнен',
  cancelled: 'Отменён',
}

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  inquiry: 'measurement',
  measurement: 'design',
  design: 'production',
  production: 'ready',
  ready: 'delivery',
  delivery: 'assembly',
  assembly: 'completed',
  completed: null,
  cancelled: null,
}

interface TransitionState {
  orderId: number
  currentStatus: OrderStatus
  nextStatus: OrderStatus
}

export default function PipelinePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: pipeline, isLoading, isError } = usePipeline()
  const [transition, setTransition] = useState<TransitionState | null>(null)
  const [comment, setComment] = useState('')

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, comment: c }: { orderId: number; status: OrderStatus; comment?: string }) =>
      changeOrderStatus(orderId, status, c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (isLoading) return <Spinner />

  if (isError || !pipeline) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Ошибка загрузки воронки
      </div>
    )
  }

  const stageMap = new Map(pipeline.map((s) => [s.status, s]))

  const openTransition = (order: Order, next: OrderStatus) => {
    setTransition({ orderId: order.id, currentStatus: order.status, nextStatus: next })
    setComment('')
  }

  const handleTransition = async () => {
    if (!transition) return
    try {
      await statusMutation.mutateAsync({
        orderId: transition.orderId,
        status: transition.nextStatus,
        comment: comment || undefined,
      })
      setTransition(null)
    } catch {
      alert('Ошибка смены статуса')
    }
  }

  const totalRevenue = pipeline.reduce((sum, s) => sum + s.total_amount, 0)
  const totalOrders = pipeline.reduce((sum, s) => sum + s.count, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Воронка продаж</h2>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <DollarSign size={16} />
            {totalRevenue.toLocaleString()} ₽
          </span>
          <span className="flex items-center gap-1">
            <Users size={16} />
            {totalOrders} заказов
          </span>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {pipelineStatuses.map((status) => {
          const stage = stageMap.get(status)
          const orders = stage?.orders ?? []

          return (
            <div
              key={status}
              className="flex-shrink-0 w-72 rounded-xl bg-gray-50 border border-gray-200 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="text-xs text-gray-400 font-medium">{orders.length}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {orders.reduce((s, o) => s + o.final_price, 0).toLocaleString()} ₽
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Нет заказов</p>
                ) : (
                  orders.map((order) => {
                    const next = nextStatus[order.status]
                    return (
                      <div
                        key={order.id}
                        className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <p className="text-xs font-mono text-gray-400 mb-1">{order.order_number}</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{order.title}</p>
                        <p className="text-xs text-gray-500 mt-1">#{order.client_id}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="text-sm font-semibold text-gray-900">
                            {order.final_price.toLocaleString()} ₽
                          </span>
                          {next && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openTransition(order, next)
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-dark transition-colors"
                            >
                              {statusLabels[next]}
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={transition !== null}
        onClose={() => setTransition(null)}
        title={
          transition
            ? `${statusLabels[transition.currentStatus]} → ${statusLabels[transition.nextStatus]}`
            : ''
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий (необязательно)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Причина смены статуса..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setTransition(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleTransition}
              disabled={statusMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {statusMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}