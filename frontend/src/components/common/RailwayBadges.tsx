import React from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Play,
  Minus
} from 'lucide-react'

export interface PriorityBadgeProps {
  level: string | number
  className?: string
  showIcon?: boolean
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, className = '', showIcon = true }) => {
  const norm = String(level).toUpperCase()
  const isCrit = norm.includes('CRIT') || norm === '5'
  const isHigh = norm.includes('HIGH') || norm === '4'
  const isMed = norm.includes('MED') || norm === '3'

  if (isCrit) {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}>
        {showIcon && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" strokeWidth={1.5} />}
        <span>Critical</span>
      </span>
    )
  }
  if (isHigh) {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}>
        {showIcon && <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.5} />}
        <span>High</span>
      </span>
    )
  }
  if (isMed) {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}>
        {showIcon && <Clock className="w-3 h-3 text-blue-400 shrink-0" strokeWidth={1.5} />}
        <span>Medium</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/80 ${className}`}>
      {showIcon && <Minus className="w-3 h-3 text-zinc-500 shrink-0" strokeWidth={1.5} />}
      <span>Low</span>
    </span>
  )
}

export interface StatusBadgeProps {
  status: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const raw = (status || '').toUpperCase()

  // Format sentence case and remove raw underscores
  const formatSentenceCase = (str: string) => {
    return str
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  const label = formatSentenceCase(status || 'Unknown')

  if (raw === 'APPROVED' || raw === 'AI_RECOMMENDED' || raw === 'RESOLVED' || raw === 'CLOSED' || raw === 'COMPLETED' || raw === 'VERIFIED') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={1.5} />
        <span>{label}</span>
      </span>
    )
  }

  if (raw === 'IN_PROGRESS' || raw === 'ACTIVE') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}>
        <Play className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.5} />
        <span>{label}</span>
      </span>
    )
  }

  if (raw === 'BLOCKED' || raw === 'DELAY_REQUESTED' || raw === 'REJECTED' || raw === 'CRITICAL_EVENT' || raw === 'REPLAN_REQUESTED') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 ${className}`}>
        <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" strokeWidth={1.5} />
        <span>{label}</span>
      </span>
    )
  }

  if (raw === 'SCHEDULED' || raw === 'ASSIGNED' || raw === 'PLAN_READY') {
    return (
      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 ${className}`}>
        <Clock className="w-3 h-3 text-blue-400 shrink-0" strokeWidth={1.5} />
        <span>{label}</span>
      </span>
    )
  }

  // Neutral / Pending state
  return (
    <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/80 ${className}`}>
      <span>{label}</span>
    </span>
  )
}

export default StatusBadge
