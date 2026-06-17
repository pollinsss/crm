import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useOrder, useChangeOrderStatus } from '../hooks/useOrders'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import type { OrderStatus } from '../types'

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  inquiry: ['measurement', 'cancelled'],
  measurement: ['design', 'cancelled'],
  design: ['production', 'cancelled'],
  production: ['ready', 'cancelled'],
  ready: ['delivery'],
  delivery: ['assembly'],
  assembly: ['completed'],
  completed: [],
  cancelled: [],
}

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

const furnitureLabels: Record<string, string> = {
  kitchen: 'Кухня',
  wardrobe: 'Шкаф',
  bed: 'Кровать',
  table: 'Стол',
  chair: 'Стул',
  sofa: 'Диван',
  hallway: 'Прихожая',
  other: 'Другое',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(Number(id))
  const statusMutation = useChangeOrderStatus(Number(id))

  const [modalOpen, setModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null)
  const [comment, setComment] = useState('')

  if (isLoading) return <Spinner />

  if (isError || !order) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Заказ не найден
      </div>
    )
  }

  const transitions = validTransitions[order.status] ?? []

  const openTransitionModal = (status: OrderStatus) => {
    setTargetStatus(status)
    setComment('')
    setModalOpen(true)
  }

  const handleTransition = async () => {
    if (!targetStatus) return
    try {
      await statusMutation.mutateAsync({ status: targetStatus, comment: comment || undefined })
      setModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Ошибка смены статуса'
      alert(msg ?? 'Ошибка смены статуса')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">
          Заказ {order.order_number}
        </h2>
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <Link
            to={`/orders/${order.id}/edit`}
            className="ml-auto text-sm text-primary hover:underline"
          >
            Редактировать
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Информация о заказе</h3>
              <StatusBadge status={order.status} />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Название</dt>
                <dd className="font-medium text-gray-900">{order.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Тип мебели</dt>
                <dd className="font-medium text-gray-900">{furnitureLabels[order.furniture_type] ?? order.furniture_type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">ID клиента</dt>
                <dd className="font-medium text-gray-900">#{order.client_id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Менеджер</dt>
                <dd className="font-medium text-gray-900">#{order.manager_id}</dd>
              </div>
              {order.description && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Описание</dt>
                  <dd className="font-medium text-gray-900 mt-1">{order.description}</dd>
                </div>
              )}
              {order.delivery_address && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Адрес доставки</dt>
                  <dd className="font-medium text-gray-900 mt-1">{order.delivery_address}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Финансы</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Цена</dt>
                <dd className="font-medium text-gray-900">{order.price.toLocaleString()} ₽</dd>
              </div>
              <div>
                <dt className="text-gray-500">Себестоимость</dt>
                <dd className="font-medium text-gray-900">{order.cost_price.toLocaleString()} ₽</dd>
              </div>
              <div>
                <dt className="text-gray-500">Скидка</dt>
                <dd className="font-medium text-gray-900">{order.discount}%</dd>
              </div>
              <div>
                <dt className="text-gray-500">Итого</dt>
                <dd className="font-medium text-gray-900">{order.final_price.toLocaleString()} ₽</dd>
              </div>
              <div>
                <dt className="text-gray-500">Маржа</dt>
                <dd className={`font-medium ${order.margin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {order.margin}%
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Даты</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Замер</dt>
                <dd className="font-medium text-gray-900">{order.measurement_date || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Срок производства</dt>
                <dd className="font-medium text-gray-900">{order.production_deadline || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Доставка</dt>
                <dd className="font-medium text-gray-900">{order.delivery_date || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Создан</dt>
                <dd className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</dd>
              </div>
              {order.completed_at && (
                <div>
                  <dt className="text-gray-500">Выполнен</dt>
                  <dd className="font-medium text-gray-900">{new Date(order.completed_at).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Переходы</h3>
            {transitions.length === 0 ? (
              <p className="text-sm text-gray-400">Нет доступных переходов</p>
            ) : (
              <div className="flex flex-col gap-2">
                {transitions.map((st) => (
                  <button
                    key={st}
                    onClick={() => openTransitionModal(st)}
                    disabled={statusMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <ArrowRight size={16} />
                    {statusLabels[st]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">История статусов</h3>
            {(!order.status_history || order.status_history.length === 0) ? (
              <p className="text-sm text-gray-400">История пуста</p>
            ) : (
              <div className="space-y-3">
                {order.status_history.map((h, i) => (
                  <div key={i} className="relative pl-5 pb-3 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                    <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm font-medium text-gray-900">
                      {h.from_status ? `${statusLabels[h.from_status as OrderStatus] ?? h.from_status} → ` : ''}
                      {statusLabels[h.to_status as OrderStatus] ?? h.to_status}
                    </p>
                    {h.comment && (
                      <p className="text-xs text-gray-500 mt-0.5">{h.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Смена статуса на «${targetStatus ? statusLabels[targetStatus] : ''}»`}
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
              onClick={() => setModalOpen(false)}
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