import { useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Receipt,
  PieChart,
  Users,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDashboardKPI, useRevenueByMonth } from '../hooks/useAnalytics'
import KpiCard from '../components/ui/KpiCard'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import type { OrderStatus } from '../types'

const activeStatuses: OrderStatus[] = [
  'inquiry',
  'measurement',
  'design',
  'production',
  'ready',
  'delivery',
  'assembly',
]

export default function DashboardPage() {
  const [months, setMonths] = useState(6)
  const { data: kpi, isLoading: kpiLoading, isError: kpiError } = useDashboardKPI()
  const { data: revenue, isLoading: revLoading } = useRevenueByMonth(months)

  if (kpiLoading) return <Spinner />

  if (kpiError || !kpi) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Ошибка загрузки дашборда
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Дашборд</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Выручка"
          value={`${kpi.revenue.current.toLocaleString()} ₽`}
          delta={kpi.revenue.delta_pct}
          deltaLabel="к прошлому месяцу"
          icon={<DollarSign size={20} />}
        />
        <KpiCard
          title="Заказы"
          value={kpi.orders.current}
          delta={kpi.orders.delta}
          deltaSuffix=""
          deltaLabel="к прошлому месяцу"
          icon={<ShoppingCart size={20} />}
        />
        <KpiCard
          title="Конверсия"
          value={`${kpi.conversion}%`}
          icon={<TrendingUp size={20} />}
        />
        <KpiCard
          title="Средний чек"
          value={`${kpi.avg_check.toLocaleString()} ₽`}
          icon={<Receipt size={20} />}
        />
        <KpiCard
          title="Маржинальность"
          value={`${kpi.avg_margin}%`}
          icon={<PieChart size={20} />}
        />
        <KpiCard
          title="Клиенты"
          value={kpi.clients_total}
          icon={<Users size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Выручка по месяцам
            </h3>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value={6}>6 месяцев</option>
              <option value={12}>12 месяцев</option>
            </select>
          </div>

          {revLoading ? (
            <Spinner />
          ) : revenue && revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()} ₽`, 'Выручка']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Активные заказы
          </h3>
          <div className="space-y-3">
            {activeStatuses.map((status) => {
              const count = kpi.active_by_status[status] ?? 0
              return (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}