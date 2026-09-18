import React from 'react'

export interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  urgency?: 'normal' | 'urgent' | 'warning' | 'accent'
  isLoading?: boolean
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  urgency = 'normal',
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3 animate-pulse ${className}`}>
        <div className="h-3 w-24 bg-zinc-800 rounded" />
        <div className="h-7 w-16 bg-zinc-800 rounded" />
        <div className="h-3 w-32 bg-zinc-800/60 rounded" />
      </div>
    )
  }

  // Differentiate meaning through accent color ONLY on the number itself when it signals urgency
  const valueColor =
    urgency === 'urgent'
      ? 'text-red-400'
      : urgency === 'warning'
      ? 'text-amber-400'
      : urgency === 'accent'
      ? 'text-blue-400'
      : 'text-zinc-100'

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between transition-colors hover:border-zinc-700/80 ${className}`}>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </div>
        <div className={`text-2xl font-bold font-mono mt-2 tracking-tight ${valueColor}`}>
          {value}
        </div>
      </div>
      {delta && (
        <div className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/80 font-normal truncate">
          {delta}
        </div>
      )}
    </div>
  )
}

export interface StatsGridProps {
  children: React.ReactNode
  className?: string
}

export const StatsGrid: React.FC<StatsGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  )
}

export default StatCard
