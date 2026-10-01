import React, { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
  enableVirtualization?: boolean
  virtualizationEnabledThreshold?: number
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
  emptyTitle = 'No records found',
  emptyDescription = 'There are no entries matching the criteria.',
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

  // Enhanced Loading State with Skeleton Loader
  if (isLoading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-base/50 border border-base rounded-xl p-8 space-y-4"
        >
          {/* Skeleton Loader matching table layout */}
          <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex items-center space-x-3">
              <div className="h-3 w-24 bg-base/30 rounded" />
              <div className="h-2 w-40 bg-base/30 rounded" />
            </div>

            {/* Rows skeleton - show 5 rows */}
            {[1, 2, 3, 4, 5].map((row, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-3 w-16 bg-base/30 rounded" />
                  <div className="h-2 w-32 bg-base/30 rounded" />
                  <div className="h-2 w-20 bg-base/30 rounded" />
                  <div className="h-2 w-20 bg-base/30 rounded" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Enhanced Error State
  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#111a2e] border border-red-500/40 rounded-2xl p-6 text-center shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Unable to load table data</h4>
          <p className="text-xs text-slate-300 mt-1">{error}</p>
          {emptyActionText && onEmptyAction && (
            <button
              onClick={onEmptyAction}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
            >
              {emptyActionText}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Enhanced Empty State
  if (data.length === 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-[#111a2e] border border-[#243552] rounded-2xl p-8 sm:p-12 text-center shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">{emptyTitle}</h4>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">{emptyDescription}</p>
          {emptyActionText && onEmptyAction && (
            <button
              onClick={onEmptyAction}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
            >
              {emptyActionText}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-[#111a2e] border border-[#243552] rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Optional Header with Title & Action controls */}
        {(title || actions) && (
          <div className="px-4 sm:px-5 py-3.5 border-b border-[#243552] bg-[#16223b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {title && <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
          </div>
        )}

        {/* Mobile Cards (<768px) with Staggered Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden divide-y divide-[#243552]/70 p-2 sm:p-3 space-y-2"
        >
          {paginatedData.map((item, idx) => {
            const key = keyExtractor(item, startIndex + idx)
            const virtualIndex = startIndex + idx

            return (
              <motion.li
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: virtualIndex * 0.03 } }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                className={`p-3.5 rounded-xl border transition-colors ${
                  selectedRowKey === key
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-[#16223b] border-[#243552]'
                }`}
              >
                {renderMobileCard ? (
                  <div key={key}>{renderMobileCard(item, startIndex + idx)}</div>
                ) : (
                  // Default structured operational card for mobile
                  <div
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      selectedRowKey === key
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-[#16223b] border-[#243552]'
                    }`}
                  >
                    <div className="space-y-2 text-xs">
                      {columns.map((col) => {
                        const val = col.render ? col.render(item, startIndex + idx) : (item as any)[col.key]
                        return (
                          <div key={col.key} className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                              {col.header}
                            </span>
                            <span className="text-white text-right font-medium text-xs">{val ?? '—'}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.li>
            )
          })}
        </motion.div>

        {/* Desktop & Tablet Table (>=768px) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="hidden md:block overflow-x-auto"
        >
          <div className="w-full">
            <table className="w-full text-left border-collapse text-slate-100">
              <thead>
                <tr className="bg-[#16223b] border-b border-[#243552] text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  {renderExpandedRow && <th className="w-8 px-3 py-3.5"></th>}
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
                        className={`px-4 py-3.5 text-slate-300 font-bold ${alignClass} ${hideClass} ${col.className || ''}`}
                      >
                        {col.header}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243552]/70 bg-[#111a2e]">
                {paginatedData.map((item, idx) => {
                  const rowIndex = startIndex + idx
                  const key = keyExtractor(item, rowIndex)
                  const isSelected = selectedRowKey === key
                  const isExpanded = expandedKeys.has(key)

                  return (
                    <React.Fragment key={key}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onRowClick && onRowClick(item)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-l-4 border-blue-500 font-semibold'
                            : 'hover:bg-[#1a2744]/80 bg-transparent'
                        }`}
                      >
                        {renderExpandedRow && (
                          <td className="px-3 py-3 w-8 text-slate-400">
                            <button
                              onClick={(e) => toggleExpand(key, e)}
                              className="p-1 hover:text-white rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
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
                            ? col.render(item, rowIndex)
                            : (item as any)[col.key]

                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-3.5 text-slate-200 align-middle ${alignClass} ${hideClass} ${col.className || ''}`}
                            >
                              {cellVal ?? '—'}
                            </td>
                          )
                        })}
                      </motion.tr>

                      {/* Expanded row content */}
                      {isExpanded && renderExpandedRow && (
                        <motion.tr
                          key={`${key}-expanded`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-slate-900/90"
                        >
                          <td colSpan={columns.length + 1} className="p-4 border-b border-[#243552]">
                            {renderExpandedRow(item)}
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Bottom Pagination Bar with Magnetic Buttons */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-3 border-t border-[#243552] bg-[#16223b] flex items-center justify-between text-xs text-slate-300"
          >
            <div>
              Showing <strong className="text-white">{startIndex + 1}</strong> to{' '}
              <strong className="text-white">
                {Math.min(startIndex + pageSize, data.length)}
              </strong>{' '}
              of <strong className="text-white">{data.length}</strong> records
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#243552] bg-[#111a2e] hover:bg-[#1a2744] disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-300 px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#243552] bg-[#111a2e] hover:bg-[#1a2744] disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default DataTable