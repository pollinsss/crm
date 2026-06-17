import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useClients, useDeleteClient } from '../hooks/useClients'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

const segmentOptions = [
  { value: 'b2c', label: 'B2C' },
  { value: 'b2b', label: 'B2B' },
  { value: 'vip', label: 'VIP' },
]

const segmentLabels: Record<string, string> = {
  b2c: 'B2C',
  b2b: 'B2B',
  vip: 'VIP',
}

export default function ClientListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const pageSize = 15

  const { data, isLoading, isError } = useClients({ page, size: pageSize, segment: segment || undefined, search: search || undefined })
  const deleteMutation = useDeleteClient()

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch {
      alert('Ошибка при удалении клиента')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Клиенты</h2>
        <Link
          to="/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Новый клиент
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск по имени, email, телефону..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="w-40">
          <Select
            value={segment}
            onChange={(v) => { setSegment(v); setPage(1) }}
            options={segmentOptions}
            placeholder="Все сегменты"
          />
        </div>
      </div>

      {isLoading && <Spinner />}

      {isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Ошибка загрузки клиентов
        </div>
      )}

      {data && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Компания</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сегмент</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      Клиенты не найдены
                    </td>
                  </tr>
                ) : (
                  data.items.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{client.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{client.company_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{client.email || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={client.segment === 'vip' ? 'warning' : client.segment === 'b2b' ? 'info' : 'default'}>
                          {segmentLabels[client.segment] ?? client.segment}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/clients/${client.id}/edit`}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(client.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-danger transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            total={data.total}
            size={data.size}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить клиента?"
      >
        <p className="text-sm text-gray-600 mb-4">
          Клиент будет деактивирован. Вы уверены?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </Modal>
    </div>
  )
}