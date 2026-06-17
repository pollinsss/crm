import { useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { downloadReport } from '../api/analytics'

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(monthAgo)
  const [dateTo, setDateTo] = useState(today)
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null)

  const download = async (type: 'pdf' | 'excel') => {
    if (!dateFrom || !dateTo) return
    setLoading(type)
    try {
      await downloadReport(type, dateFrom, dateTo)
    } catch {
      alert('Ошибка скачивания отчёта')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Отчёты</h2>

      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата с</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата по</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => download('pdf')}
            disabled={!dateFrom || !dateTo || loading === 'pdf'}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FileText size={18} />
            {loading === 'pdf' ? 'Скачивание...' : 'PDF'}
          </button>
          <button
            onClick={() => download('excel')}
            disabled={!dateFrom || !dateTo || loading === 'excel'}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet size={18} />
            {loading === 'excel' ? 'Скачивание...' : 'Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}