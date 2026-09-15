import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter
} from 'lucide-react'

export interface ColumnDef<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  priority?: 'essential' | 'medium' | 'low'
  className?: string
  render?: (item: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T, index: number) => string | number
  title?: string
  subtitle?: string
  renderMobileCard?: (item: T, index: number) => React.ReactNode
  renderExpandedRow?: (item: T) => React.ReactNode
  isLoading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyActionText?: string
  onEmptyAction?: () => void
  pageSize?: number
  actions?: React.ReactNode
  selectedRowKey?: string | number | null
  onRowClick?: (item: T) => void
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  title,
  subtitle,
  renderMobileCard,
  renderExpandedRow,
  isLoading = false,
  error = null,
  emptyTitle = 'No operational records found',
  emptyDescription = 'There are no active entries matching the criteria.',
  emptyActionText,
  onEmptyAction,
  pageSize = 10,
  actions,
  selectedRowKey = null,
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set())

  const toggleExpand = (key: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(expandedKeys)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setExpandedKeys(next)
  }

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = data.slice(startIndex, startIndex + pageSize)

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="flex flex-col items-center justify-center space-y-3 py-10">
          <div className="w-8 h-8 rounded-full border-3 border-rail-maroon border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading operational railway records...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6 text-center shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center mx-auto mb-2.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Unable to load table data</h4>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Optional Header with Title & Action controls */}
      {(title || actions) && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Empty State */}
      {data.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">{emptyTitle}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptyDescription}</p>
          {emptyActionText && onEmptyAction && (
            <button
              onClick={onEmptyAction}
              className="mt-4 px-4 py-2 bg-rail-maroon text-white text-xs font-bold rounded-lg hover:bg-rail-maroon-light transition-colors min-h-[44px]"
            >
              {emptyActionText}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards (<768px) */}
          <div className="md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2">
            {paginatedData.map((item, idx) => {
              const key = keyExtractor(item, startIndex + idx)
              if (renderMobileCard) {
                return <div key={key}>{renderMobileCard(item, startIndex + idx)}</div>
              }

              // Default structured operational card for mobile
              return (
                <div
                  key={key}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    selectedRowKey === key
                      ? 'bg-rose-50/50 border-rail-maroon'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-2 text-xs">
                    {columns.map((col) => {
                      const val = col.render ? col.render(item, startIndex + idx) : (item as any)[col.key]
                      return (
                        <div key={col.key} className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                            {col.header}
                          </span>
                          <span className="text-slate-900 text-right font-medium text-xs">{val ?? '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop & Tablet Table (>=768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  {renderExpandedRow && <th className="w-8 px-3 py-3"></th>}
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'

                    const hideClass =
                      col.priority === 'low'
                        ? 'hidden lg:table-cell'
                        : col.priority === 'medium'
                        ? 'hidden sm:table-cell'
                        : ''

                    return (
                      <th
                        key={col.key}
                        className={`px-4 py-3 text-slate-700 ${alignClass} ${hideClass} ${col.className || ''}`}
                      >
                        {col.header}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((item, idx) => {
                  const key = keyExtractor(item, startIndex + idx)
                  const isSelected = selectedRowKey === key
                  const isExpanded = expandedKeys.has(key)

                  return (
                    <React.Fragment key={key}>
                      <tr
                        onClick={() => onRowClick && onRowClick(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50/70 border-l-4 border-rail-maroon font-semibold'
                            : 'hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        {renderExpandedRow && (
                          <td className="px-3 py-3 w-8 text-slate-400">
                            <button
                              onClick={(e) => toggleExpand(key, e)}
                              className="p-1 hover:text-slate-700 rounded transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        )}

                        {columns.map((col) => {
                          const alignClass =
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'

                          const hideClass =
                            col.priority === 'low'
                              ? 'hidden lg:table-cell'
                              : col.priority === 'medium'
                              ? 'hidden sm:table-cell'
                              : ''

                          const cellVal = col.render
                            ? col.render(item, startIndex + idx)
                            : (item as any)[col.key]

                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-3 text-slate-800 align-middle ${alignClass} ${hideClass} ${col.className || ''}`}
                            >
                              {cellVal ?? '—'}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Expanded row content */}
                      {isExpanded && renderExpandedRow && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={columns.length + 1} className="p-4 border-b border-slate-200">
                            {renderExpandedRow(item)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Bar */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <strong className="text-slate-900">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-900">
                  {Math.min(startIndex + pageSize, data.length)}
                </strong>{' '}
                of <strong className="text-slate-900">{data.length}</strong> records
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-800 px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DataTable
