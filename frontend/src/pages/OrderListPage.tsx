import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { useOrders } from '../hooks/useOrders'
import { useClients } from '../hooks/useClients'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import type { OrderStatus } from '../types'

const statusOptions = [
  { value: 'INQUIRY', label: 'Заявка' },
  { value: 'MEASUREMENT', label: 'Замер' },
  { value: 'DESIGN', label: 'Дизайн' },
  { value: 'PRODUCTION', label: 'Производство' },
  { value: 'READY', label: 'Готов' },
  { value: 'DELIVERY', label: 'Доставка' },
  { value: 'ASSEMBLY', label: 'Сборка' },
  { value: 'COMPLETED', label: 'Выполнен' },
  { value: 'CANCELLED', label: 'Отменён' },
]

export default function OrderListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const pageSize = 15

  const { data: ordersData, isLoading, isError } = useOrders({
    page,
    size: pageSize,
    status: statusFilter as OrderStatus | undefined,
  })

  const { data: clientsData } = useClients({ size: 100 })

  const clientMap = new Map(clientsData?.items.map((c) => [c.id, c.full_name]) ?? [])

  const filteredOrders = ordersData?.items.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.title.toLowerCase().includes(q) ||
      (clientMap.get(o.client_id) ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Заказы</h2>
        <Link
          to="/orders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Новый заказ
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по номеру, названию, клиенту..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
            options={statusOptions}
            placeholder="Все статусы"
          />
        </div>
      </div>

      {isLoading && <Spinner />}

      {isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Ошибка загрузки заказов
        </div>
      )}

      {ordersData && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(filteredOrders?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      Заказы не найдены
                    </td>
                  </tr>
                ) : (
                  filteredOrders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{clientMap.get(order.client_id) ?? `#${order.client_id}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.final_price.toLocaleString()} ₽</td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Eye size={16} />
                          Подробнее
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={ordersData.page}
            total={ordersData.total}
            size={ordersData.size}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}