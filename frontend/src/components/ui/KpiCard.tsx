import type { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  delta?: number
  deltaLabel?: string
  deltaSuffix?: string
  icon: ReactNode
}

export default function KpiCard({ title, value, delta, deltaLabel, deltaSuffix = '%', icon }: KpiCardProps) {
  const deltaValue = delta ?? 0
  const isPositive = deltaValue >= 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-lg bg-primary-light p-2.5 text-primary">
          {icon}
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          <span className={isPositive ? 'text-success' : 'text-danger'}>
            {isPositive ? '↑' : '↓'} {Math.abs(deltaValue)}{deltaSuffix}
          </span>
          {deltaLabel && <span className="text-gray-400">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}