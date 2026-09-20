import React from 'react'
import { X, ShieldAlert, AlertTriangle, Activity, Calendar, Zap, Gauge } from 'lucide-react'

interface CriticalityBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  task: {
    task_id: number
    description: string
    department: string
    priority_score?: number
    breakdown?: {
      safety_impact: number
      failure_probability_score: number
      asset_criticality_score: number
      overdue_factor: number
      defect_severity: number
      operational_impact: number
      total_score: number
      formula?: string
    }
  } | null
}

export const CriticalityBreakdownModal: React.FC<CriticalityBreakdownModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  if (!isOpen || !task) return null

  const b = task.breakdown || {
    safety_impact: 24,
    failure_probability_score: 20,
    asset_criticality_score: 18,
    overdue_factor: 8,
    defect_severity: 8,
    operational_impact: 4,
    total_score: task.priority_score || 82,
    formula: 'safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)'
  }

  const items = [
    { label: 'Safety Impact Factor', val: b.safety_impact, max: 30, color: 'bg-rose-500', icon: ShieldAlert },
    { label: 'Asset Failure Probability (ML)', val: b.failure_probability_score, max: 25, color: 'bg-amber-500', icon: Activity },
    { label: 'Asset Baseline Criticality', val: b.asset_criticality_score, max: 20, color: 'bg-blue-500', icon: Gauge },
    { label: 'Overdue Elapsed Days Factor', val: b.overdue_factor, max: 10, color: 'bg-orange-500', icon: Calendar },
    { label: 'Defect Severity Rating', val: b.defect_severity, max: 10, color: 'bg-red-500', icon: AlertTriangle },
    { label: 'Corridor Operational Impact', val: b.operational_impact, max: 5, color: 'bg-indigo-500', icon: Zap }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-zinc-100 text-base">Task Criticality Breakdown</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                T-{task.task_id}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{task.department} • Explainable ML-Assisted Score</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total Score Header */}
          <div className="flex items-center justify-between p-4 rounded bg-zinc-950 border border-zinc-800">
            <div>
              <span className="text-xs text-zinc-500 font-mono uppercase block">Normalized Priority Score</span>
              <span className="text-3xl font-mono font-semibold text-amber-400">{b.total_score} / 100</span>
            </div>
            <div className="text-right text-xs font-mono">
              <span className="text-zinc-500 block">Category</span>
              <span className={`font-medium ${b.total_score >= 80 ? 'text-rose-400' : b.total_score >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {b.total_score >= 80 ? 'CRITICAL (Priority 1)' : b.total_score >= 60 ? 'HIGH (Priority 2)' : 'STANDARD'}
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2.5 rounded border border-zinc-800 font-mono">
            "{task.description}"
          </p>

          {/* Breakdown Bars */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Score Components</h5>
            {items.map((item, idx) => {
              const Icon = item.icon
              const pct = Math.min(100, Math.round((item.val / item.max) * 100))
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 flex items-center space-x-1.5">
                      <Icon className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-zinc-300">{item.val} / {item.max} pts</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formula disclosure */}
          <div className="p-3 rounded bg-zinc-950/60 text-[11px] font-mono text-zinc-500 border border-zinc-800">
            <span className="text-zinc-400 block mb-0.5">Deterministic Formula:</span>
            <span>{b.formula || 'safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)'}</span>
          </div>
        </div>

        <div className="p-4 bg-zinc-950/40 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Close breakdown
          </button>
        </div>
      </div>
    </div>
  )
}
