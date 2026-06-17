import Badge from './Badge'

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  inquiry: { label: 'Заявка', variant: 'info' },
  measurement: { label: 'Замер', variant: 'warning' },
  design: { label: 'Дизайн', variant: 'warning' },
  production: { label: 'Производство', variant: 'warning' },
  ready: { label: 'Готов', variant: 'info' },
  delivery: { label: 'Доставка', variant: 'warning' },
  assembly: { label: 'Сборка', variant: 'warning' },
  completed: { label: 'Выполнен', variant: 'success' },
  cancelled: { label: 'Отменён', variant: 'danger' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}