import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useOrder, useCreateOrder, useUpdateOrder } from '../hooks/useOrders'
import { useClients } from '../hooks/useClients'
import type { FurnitureType } from '../types'
import Spinner from '../components/ui/Spinner'

const furnitureOptions: { value: FurnitureType; label: string }[] = [
  { value: 'kitchen', label: 'Кухня' },
  { value: 'wardrobe', label: 'Шкаф' },
  { value: 'bed', label: 'Кровать' },
  { value: 'table', label: 'Стол' },
  { value: 'chair', label: 'Стул' },
  { value: 'sofa', label: 'Диван' },
  { value: 'hallway', label: 'Прихожая' },
  { value: 'other', label: 'Другое' },
]

interface FormData {
  client_id: string
  furniture_type: string
  title: string
  description: string
  price: string
  cost_price: string
  discount: string
  measurement_date: string
  production_deadline: string
  delivery_date: string
  delivery_address: string
}

const emptyForm: FormData = {
  client_id: '',
  furniture_type: 'other',
  title: '',
  description: '',
  price: '0',
  cost_price: '0',
  discount: '0',
  measurement_date: '',
  production_deadline: '',
  delivery_date: '',
  delivery_address: '',
}

export default function OrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: order, isLoading: isOrderLoading } = useOrder(isEdit ? Number(id) : undefined)
  const { data: clientsData } = useClients({ size: 100 })
  const createMutation = useCreateOrder()
  const updateMutation = useUpdateOrder(Number(id))

  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) {
      setForm({
        client_id: String(order.client_id),
        furniture_type: order.furniture_type,
        title: order.title,
        description: order.description ?? '',
        price: String(order.price),
        cost_price: String(order.cost_price),
        discount: String(order.discount),
        measurement_date: order.measurement_date ?? '',
        production_deadline: order.production_deadline ?? '',
        delivery_date: order.delivery_date ?? '',
        delivery_address: order.delivery_address ?? '',
      })
    }
  }, [order])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.client_id || !form.title.trim()) {
      setError('Клиент и название обязательны')
      return
    }

    const payload = {
      client_id: Number(form.client_id),
      furniture_type: form.furniture_type as FurnitureType,
      title: form.title,
      description: form.description || undefined,
      price: Number(form.price) || 0,
      cost_price: Number(form.cost_price) || 0,
      discount: Number(form.discount) || 0,
      measurement_date: form.measurement_date || undefined,
      production_deadline: form.production_deadline || undefined,
      delivery_date: form.delivery_date || undefined,
      delivery_address: form.delivery_address || undefined,
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate('/orders')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail ?? 'Ошибка сохранения заказа')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ошибка сохранения заказа')
      }
    }
  }

  if (isEdit && isOrderLoading) return <Spinner />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/orders" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Редактировать заказ' : 'Новый заказ'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Основные данные</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент *</label>
            <select
              value={form.client_id}
              onChange={set('client_id')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Выберите клиента</option>
              {clientsData?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.company_name ? `(${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип мебели</label>
              <select
                value={form.furniture_type}
                onChange={set('furniture_type')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {furnitureOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={set('description')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Финансы</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена (₽)</label>
              <input
                type="number"
                value={form.price}
                onChange={set('price')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Себестоимость (₽)</label>
              <input
                type="number"
                value={form.cost_price}
                onChange={set('cost_price')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Скидка (%)</label>
              <input
                type="number"
                value={form.discount}
                onChange={set('discount')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Даты и адрес</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата замера</label>
              <input
                type="date"
                value={form.measurement_date}
                onChange={set('measurement_date')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок производства</label>
              <input
                type="date"
                value={form.production_deadline}
                onChange={set('production_deadline')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата доставки</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={set('delivery_date')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
              <input
                type="text"
                value={form.delivery_address}
                onChange={set('delivery_address')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            to="/orders"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}