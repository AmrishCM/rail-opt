import React from 'react'
import { EmptyState } from './EmptyState'
import { Inbox, AlertCircle } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  priority?: 'essential' | 'medium' | 'low'
  className?: string
}

export interface OperationalTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  renderMobileCard?: (item: T) => React.ReactNode
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionText?: string
  onEmptyAction?: () => void
  error?: string | null
}

export function OperationalTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyActionText,
  onEmptyAction,
  error = null,
}: OperationalTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs">
        <div className="flex flex-col items-center justify-center space-y-3 py-10">
          <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading operational records...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Failed to load data</h4>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionText={emptyActionText}
        onAction={onEmptyAction}
        icon={Inbox}
      />
    )
  }

  return (
    <div>
      {/* Mobile Card View (<768px) */}
      <div className="md:hidden space-y-3">
        {data.map((item) => {
          const key = keyExtractor(item)
          if (renderMobileCard) {
            return <div key={key}>{renderMobileCard(item)}</div>
          }

          // Fallback auto-generated card for mobile
          return (
            <div
              key={key}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="space-y-2">
                {columns.map((col) => {
                  const val = col.render ? col.render(item) : (item as any)[col.key]
                  return (
                    <div key={col.key} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">{col.header}</span>
                      <span className="text-slate-900 text-right">{val ?? '—'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop / Tablet Table (>=768px) */}
      <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                {columns.map((col) => {
                  // On tablet, hide 'low' priority columns
                  const visibilityClass =
                    col.priority === 'low'
                      ? 'hidden lg:table-cell'
                      : col.priority === 'medium'
                      ? 'hidden sm:table-cell'
                      : ''

                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-bold ${visibilityClass} ${col.className || ''}`}
                    >
                      {col.header}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item) => {
                const key = keyExtractor(item)
                return (
                  <tr
                    key={key}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {columns.map((col) => {
                      const visibilityClass =
                        col.priority === 'low'
                          ? 'hidden lg:table-cell'
                          : col.priority === 'medium'
                          ? 'hidden sm:table-cell'
                          : ''

                      const cellVal = col.render ? col.render(item) : (item as any)[col.key]

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-3.5 text-slate-700 align-middle ${visibilityClass} ${
                            col.className || ''
                          }`}
                        >
                          {cellVal ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
