import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { Plus, CheckCircle, Clock, MapPin } from 'lucide-react'
import { useEvents, useCreateEvent, useCompleteEvent } from '../hooks/useSchedule'
import { useOrders } from '../hooks/useOrders'
import { fetchUsers } from '../api/auth'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import type { OrderStatus } from '../types'

const eventTypeLabels: Record<string, string> = {
  measurement: 'Замер',
  delivery: 'Доставка',
  assembly: 'Сборка',
}

const eventTypeVariants: Record<string, 'info' | 'warning' | 'default'> = {
  measurement: 'info',
  delivery: 'warning',
  assembly: 'default',
}

const eventTypeOrderStatuses: Record<string, OrderStatus[]> = {
  measurement: ['inquiry', 'measurement'],
  delivery: ['ready', 'delivery'],
  assembly: ['delivery', 'assembly'],
}

interface FormData {
  event_type: string
  title: string
  order_id: string
  assigned_user_id: string
  address: string
  scheduled_date: string
  scheduled_time: string
  duration_minutes: string
  notes: string
}

const emptyForm: FormData = {
  event_type: 'measurement',
  title: '',
  order_id: '',
  assigned_user_id: '',
  address: '',
  scheduled_date: '',
  scheduled_time: '',
  duration_minutes: '60',
  notes: '',
}

export default function SchedulePage() {
  const today = new Date().toISOString().slice(0, 10)
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(weekLater)

  const { data: events, isLoading, isError } = useEvents({ date_from: dateFrom, date_to: dateTo })
  const { data: ordersData } = useOrders({ size: 100 })
  const createMutation = useCreateEvent()
  const completeMutation = useCompleteEvent()

  const [users, setUsers] = useState<{ id: number; full_name: string }[]>([])
  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {})
  }, [])

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState('')

  const relevantOrders = useMemo(() => {
    if (!ordersData?.items) return []
    const relevantStatuses = eventTypeOrderStatuses[form.event_type] ?? []
    return ordersData.items.filter((o) => relevantStatuses.includes(o.status))
  }, [ordersData, form.event_type])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const hm = form.scheduled_time ? form.scheduled_time.split(':') : ['', '']

  const handleHour = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    const num = Number(val)
    if (val && (num < 0 || num > 23)) return
    setForm((prev) => ({ ...prev, scheduled_time: val ? `${val}:${hm[1] || '00'}` : `:${hm[1] || '00'}` }))
  }

  const handleMinute = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    const num = Number(val)
    if (val && (num < 0 || num > 59)) return
    setForm((prev) => ({ ...prev, scheduled_time: `${hm[0] || '00'}:${val ? val : ''}` }))
  }

  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value
    setForm((prev) => ({ ...prev, order_id: orderId }))
    if (orderId) {
      const order = ordersData?.items.find((o) => o.id === Number(orderId))
      setForm((prev) => ({ ...prev, address: order?.delivery_address ?? '' }))
    } else {
      setForm((prev) => ({ ...prev, address: '' }))
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim() || !form.scheduled_date || !form.scheduled_time) {
      setFormError('Название, дата и время обязательны')
      return
    }

    const hm = form.scheduled_time ? form.scheduled_time.split(':') : ['', '']
    const hh = hm[0] ? hm[0].padStart(2, '0') : ''
    const mm = hm[1] ? hm[1].padStart(2, '0') : ''
    const scheduled_at = `${form.scheduled_date}T${hh || '00'}:${mm || '00'}:00`

    try {
      await createMutation.mutateAsync({
        event_type: form.event_type,
        title: form.title,
        order_id: form.order_id ? Number(form.order_id) : undefined,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : undefined,
        address: form.address || undefined,
        scheduled_at,
        duration_minutes: Number(form.duration_minutes) || 60,
        notes: form.notes || undefined,
      })
      setModalOpen(false)
    } catch {
      setFormError('Ошибка создания события')
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync(id)
    } catch {
      alert('Ошибка отметки события')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">События</h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Новое событие
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Дата с</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Дата по</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading && <Spinner />}

      {isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Ошибка загрузки событий
        </div>
      )}

      {events && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заказ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Адрес</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата/время</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Длит.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                    События не найдены
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={eventTypeVariants[ev.event_type] ?? 'default'}>
                        {eventTypeLabels[ev.event_type] ?? ev.event_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{ev.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ev.order_id ? `#${ev.order_id}` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {ev.address || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(ev.scheduled_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ev.duration_minutes} мин</td>
                    <td className="px-4 py-3">
                      {ev.is_completed ? (
                        <Badge variant="success">Выполнено</Badge>
                      ) : (
                        <Badge variant="warning">Активно</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!ev.is_completed && (
                        <button
                          onClick={() => handleComplete(ev.id)}
                          disabled={completeMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={14} />
                          Выполнено
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новое событие">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
              <select
                value={form.event_type}
                onChange={set('event_type')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="measurement">Замер</option>
                <option value="delivery">Доставка</option>
                <option value="assembly">Сборка</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={set('duration_minutes')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заказ</label>
              <select
                value={form.order_id}
                onChange={handleOrderChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Без заказа</option>
                {relevantOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} — {o.title} ({o.order_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
              <select
                value={form.assigned_user_id}
                onChange={set('assigned_user_id')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Не назначен</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    #{u.id} — {u.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <input
              type="text"
              value={form.address}
              onChange={set('address')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={set('scheduled_date')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Время *</label>
              <div className="flex items-center gap-1">
<input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={hm[0]}
                  onChange={handleHour}
                  placeholder="ЧЧ"
                  className="block w-16 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-gray-400 text-lg font-medium">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={hm[1]}
                  onChange={handleMinute}
                  placeholder="ММ"
                  className="block w-16 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}