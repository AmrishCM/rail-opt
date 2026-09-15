import React from 'react'
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  XCircle,
  ShieldCheck,
  RotateCcw
} from 'lucide-react'

export interface PriorityBadgeProps {
  level: string | number
  className?: string
  showIcon?: boolean
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ level, className = '', showIcon = true }) => {
  const norm = String(level).toUpperCase()
  let isCrit = norm.includes('CRIT') || norm === '5'
  let isHigh = norm.includes('HIGH') || norm === '4'
  let isMed = norm.includes('MED') || norm === '3'

  if (isCrit) {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />}
        <span>CRITICAL</span>
      </span>
    )
  }
  if (isHigh) {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
        <span>HIGH</span>
      </span>
    )
  }
  if (isMed) {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
        <span>MEDIUM</span>
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      <span>LOW</span>
    </span>
  )
}

export interface StatusBadgeProps {
  status: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const s = (status || '').toUpperCase()

  if (s === 'APPROVED' || s === 'AI_RECOMMENDED' || s === 'RESOLVED' || s === 'CLOSED' || s === 'COMPLETED') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
        <span>{s.replace('_', ' ')}</span>
      </span>
    )
  }

  if (s === 'IN_PROGRESS') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
        <Play className="w-3 h-3 text-amber-700 shrink-0" />
        <span>IN PROGRESS</span>
      </span>
    )
  }

  if (s === 'BLOCKED' || s === 'DELAY_REQUESTED' || s === 'REJECTED' || s === 'CRITICAL_EVENT') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 ${className}`}>
        <AlertTriangle className="w-3 h-3 text-red-700 shrink-0" />
        <span>{s.replace('_', ' ')}</span>
      </span>
    )
  }

  if (s === 'SCHEDULED' || s === 'ASSIGNED') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
        <Clock className="w-3 h-3 text-blue-700 shrink-0" />
        <span>{s.replace('_', ' ')}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      <span>{s.replace('_', ' ')}</span>
    </span>
  )
}
