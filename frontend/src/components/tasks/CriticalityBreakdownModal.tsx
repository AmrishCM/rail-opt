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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 text-base">Task Criticality Breakdown</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                T-{task.task_id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{task.department} • Explainable ML-Assisted Score</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total Score Header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white shadow-xs">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Normalized Priority Score</span>
              <span className="text-3xl font-extrabold text-amber-400">{b.total_score} / 100</span>
            </div>
            <div className="text-right text-xs text-slate-300">
              <span className="block font-bold">Category</span>
              <span className={`font-bold ${b.total_score >= 80 ? 'text-rose-400' : (b.total_score >= 60 ? 'text-amber-400' : 'text-emerald-400')}`}>
                {b.total_score >= 80 ? 'CRITICAL (Priority 1)' : (b.total_score >= 60 ? 'HIGH (Priority 2)' : 'STANDARD')}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            "{task.description}"
          </p>

          {/* Breakdown Bars */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Score Components</h5>
            {items.map((item, idx) => {
              const Icon = item.icon
              const pct = Math.min(100, Math.round((item.val / item.max) * 100))
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-bold text-slate-900">{item.val} / {item.max} pts</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Formula disclosure */}
          <div className="p-3 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-600 border border-slate-200">
            <span className="font-bold text-slate-700 block font-sans">Deterministic Formula:</span>
            <span>{b.formula || 'safety(30) + failure_prob(25) + asset_crit(20) + overdue(10) + severity(10) + op_impact(5)'}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  )
}
