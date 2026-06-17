import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  total: number
  size: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, total, size, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size))

  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: (number | 'dots')[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (left > 2) pages.push('dots')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('dots')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {getPages().map((p, i) =>
        p === 'dots' ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex items-center justify-center min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}