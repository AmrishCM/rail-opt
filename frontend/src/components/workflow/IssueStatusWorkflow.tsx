import React, { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Cpu,
  UserCheck,
  Wrench,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import api from '../../services/api'

interface WorkflowStage {
  key: string
  label: string
  order: number
  state: 'completed' | 'current' | 'future' | 'skipped'
  audit?: {
    timestamp?: string
    user_id?: string
    details?: string
  }
}

interface AuditItem {
  log_id: number
  action: string
  user_id: string
  details: string
  timestamp: string
}

interface IssueStatusWorkflowProps {
  taskId: number
  currentStatus?: string
  referenceNo?: string
  compact?: boolean
}

export const IssueStatusWorkflow: React.FC<IssueStatusWorkflowProps> = ({
  taskId,
  currentStatus,
  referenceNo,
  compact = false
}) => {
  const [loading, setLoading] = useState(true)
  const [stages, setStages] = useState<WorkflowStage[]>([])
  const [hasReplan, setHasReplan] = useState(false)
  const [replanStages, setReplanStages] = useState<WorkflowStage[]>([])
  const [audits, setAudits] = useState<AuditItem[]>([])
  const [status, setStatus] = useState(currentStatus || 'REPORTED')

  useEffect(() => {
    let isMounted = true
    const fetchWorkflow = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/tasks/${taskId}/workflow`)
        if (isMounted && res.data) {
          setStages(res.data.stages || [])
          setHasReplan(res.data.has_replan || false)
          setReplanStages(res.data.replan_stages || [])
          setAudits(res.data.audits || [])
          setStatus(res.data.current_status || currentStatus)
        }
      } catch (err) {
        console.error('Failed to load issue workflow:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (taskId) {
      fetchWorkflow()
    }

    return () => {
      isMounted = false
    }
  }, [taskId, currentStatus])

  const getStageIcon = (key: string) => {
    switch (key) {
      case 'REPORTED':
        return <AlertTriangle className="w-3.5 h-3.5" />
      case 'AI_PLANNING':
        return <Cpu className="w-3.5 h-3.5" />
      case 'PLAN_READY':
        return <Sparkles className="w-3.5 h-3.5" />
      case 'MANAGER_REVIEW':
        return <UserCheck className="w-3.5 h-3.5" />
      case 'APPROVED':
        return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'ASSIGNED':
        return <UserCheck className="w-3.5 h-3.5" />
      case 'IN_PROGRESS':
        return <Wrench className="w-3.5 h-3.5" />
      case 'RESOLVED':
        return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'VERIFIED':
        return <ShieldCheck className="w-3.5 h-3.5" />
      case 'CLOSED':
        return <Lock className="w-3.5 h-3.5" />
      case 'REPLAN_REQUESTED':
        return <RotateCcw className="w-3.5 h-3.5" />
      default:
        return <Clock className="w-3.5 h-3.5" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center space-x-2 text-xs text-slate-400">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading operational workflow state...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Workflow Timeline Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Operational Lifecycle:
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">
              {referenceNo || `RO-2026-${taskId}`}
            </span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {status}
          </span>
        </div>

        {/* Main 10-Stage Pipeline */}
        <div className="flex items-center space-x-2 min-w-[760px] py-2">
          {stages.map((stage, idx) => {
            const isCompleted = stage.state === 'completed'
            const isCurrent = stage.state === 'current'
            const isFuture = stage.state === 'future'

            return (
              <React.Fragment key={stage.key}>
                <div
                  className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20 scale-105'
                      : isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                  }`}
                  style={{ minWidth: '84px', flex: 1 }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${
                      isCurrent
                        ? 'bg-blue-500 text-white animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stage.key)}
                  </div>
                  <span className="text-[10px] font-bold leading-tight uppercase">
                    {stage.label}
                  </span>
                  {stage.audit?.timestamp && (
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">
                      {new Date(stage.audit.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
                {idx < stages.length - 1 && (
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isCompleted ? 'text-emerald-400' : 'text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Replan Branch (if active or previously executed) */}
        {hasReplan && replanStages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-800">
            <div className="flex items-center space-x-1.5 mb-2 text-xs font-semibold text-amber-400">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>In-Flight Replan Sub-Workflow (Plan v2 Possession Extension):</span>
            </div>
            <div className="flex items-center space-x-2 min-w-[500px]">
              {replanStages.map((rs, idx) => (
                <React.Fragment key={rs.key}>
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                      rs.state === 'current'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : rs.state === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {rs.state === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{rs.label}</span>
                  </div>
                  {idx < replanStages.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audit Log / Event Trail */}
      {!compact && audits.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Operational State Audit Trail ({audits.length} events)
          </h4>
          <div className="space-y-2">
            {audits.map((a) => (
              <div
                key={a.log_id}
                className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-blue-400 font-mono text-[11px]">
                      {a.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {a.user_id}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{a.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-3">
                  {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IssueStatusWorkflow
