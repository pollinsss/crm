import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useClient, useCreateClient, useUpdateClient } from '../hooks/useClients'
import type { ClientSegment } from '../types'
import Spinner from '../components/ui/Spinner'

const segmentOptions = [
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' },
  { value: 'vip', label: 'VIP' },
]

interface FormData {
  full_name: string
  company_name: string
  phone: string
  email: string
  address: string
  segment: string
  preferred_style: string
  preferred_materials: string
  notes: string
}

const emptyForm: FormData = {
  full_name: '',
  company_name: '',
  phone: '',
  email: '',
  address: '',
  segment: 'b2c',
  preferred_style: '',
  preferred_materials: '',
  notes: '',
}

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: client, isLoading: isClientLoading } = useClient(isEdit ? Number(id) : undefined)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient(Number(id))

  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (client) {
      setForm({
        full_name: client.full_name,
        company_name: client.company_name ?? '',
        phone: client.phone,
        email: client.email ?? '',
        address: client.address ?? '',
        segment: client.segment,
        preferred_style: client.preferred_style ?? '',
        preferred_materials: client.preferred_materials ?? '',
        notes: client.notes ?? '',
      })
    }
  }, [client])

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('Имя и телефон обязательны')
      return
    }

    try {
      const payload = {
        full_name: form.full_name,
        company_name: form.company_name || undefined,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address || undefined,
        segment: form.segment as ClientSegment,
        preferred_style: form.preferred_style || undefined,
        preferred_materials: form.preferred_materials || undefined,
        notes: form.notes || undefined,
      }
      if (isEdit) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate('/clients')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail ?? 'Ошибка сохранения клиента')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ошибка сохранения клиента')
      }
    }
  }

  if (isEdit && isClientLoading) return <Spinner />

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/clients" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? 'Редактировать клиента' : 'Новый клиент'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Основные данные</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={set('full_name')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Компания</label>
              <input
                type="text"
                value={form.company_name}
                onChange={set('company_name')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
              <input
                type="text"
                value={form.phone}
                onChange={set('phone')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
              <input
                type="text"
                value={form.address}
                onChange={set('address')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Сегментация и предпочтения</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сегмент</label>
              <select
                value={form.segment}
                onChange={set('segment')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {segmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Предпочитаемый стиль</label>
              <input
                type="text"
                value={form.preferred_style}
                onChange={set('preferred_style')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Предпочитаемые материалы</label>
              <input
                type="text"
                value={form.preferred_materials}
                onChange={set('preferred_materials')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            to="/clients"
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