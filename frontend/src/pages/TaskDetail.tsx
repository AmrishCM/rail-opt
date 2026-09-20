import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { fetchTask, fetchRequestTrace, generateRecommendedPlan } from '../services/api'
import {
  Wrench,
  ArrowLeft,
  ShieldAlert,
  Clock,
  MapPin,
  Activity,
  AlertTriangle,
  Calendar,
  Gauge,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileCheck,
  History,
  Layers
} from 'lucide-react'

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [task, setTask] = useState<any | null>(null)
  const [trace, setTrace] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPlan, setGeneratingPlan] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const taskId = id ? Number(id) : 1001
      const [tRes, traceRes] = await Promise.all([
        fetchTask(taskId),
        fetchRequestTrace(taskId).catch(() => null)
      ])
      setTask(tRes)
      setTrace(traceRes?.trace || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!task) return
    setGeneratingPlan(true)
    try {
      const res = await generateRecommendedPlan({
        corridor_ids: [task.corridor_id || 2],
        departments: [task.department],
        maintenance_request_id: task.task_id
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      if (res?.plan_id) {
        navigate(`/plans/${res.plan_id}`)
      } else {
        loadData()
      }
    } catch (e) {
      console.error('Failed to generate plan:', e)
    } finally {
      setGeneratingPlan(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading maintenance request...
      </div>
    )
  }

  if (!task) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-base font-semibold text-zinc-100">Maintenance Request Not Found</h2>
        <Link to="/tasks" className="text-xs font-medium text-blue-400 hover:underline">Back to Requests</Link>
      </div>
    )
  }

  const refNo = task.reference_no || `MR-2026-${String(task.task_id).padStart(5, '0')}`
  const statusStr = task.status || 'SUBMITTED'

  // Step indices for Workflow Status Bar
  const steps = [
    { label: 'REPORT', key: 'SUBMITTED' },
    { label: 'AI PLAN', key: 'PLAN_PENDING_REVIEW' },
    { label: 'REVIEW', key: 'PLAN_PENDING_APPROVAL' },
    { label: 'APPROVAL', key: 'APPROVED' },
    { label: 'EXECUTION', key: 'IN_PROGRESS' },
    { label: 'COMPLETION', key: 'COMPLETED' }
  ]

  const getStepIndex = (status: string) => {
    if (status === 'COMPLETED' || status === 'RESOLVED' || status === 'CLOSED') return 5
    if (status === 'IN_PROGRESS') return 4
    if (status === 'SCHEDULED' || status === 'APPROVED') return 3
    if (status === 'PLAN_PENDING_APPROVAL' || status === 'MANAGER_APPROVAL') return 2
    if (status === 'PLAN_PENDING_REVIEW' || status === 'AI_RECOMMENDED') return 1
    return 0
  }

  const currentStepIdx = getStepIndex(statusStr)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/tasks"
              className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight font-mono">
                  Maintenance Request {refNo}
                </h1>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded uppercase border ${
                  statusStr === 'COMPLETED' || statusStr === 'RESOLVED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : statusStr === 'IN_PROGRESS'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {statusStr}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Reported {new Date(task.created_at || Date.now()).toLocaleDateString()} &bull; Corridor {task.corridor_id || 2}
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Lifecycle Stepper */}
        <div className="pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-zinc-500 mb-2">
            <span>Workflow Lifecycle Progress</span>
            <span className="text-blue-400">Step {currentStepIdx + 1} of 6</span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {steps.map((s, idx) => {
              const isPast = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={s.key} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      isCurrent
                        ? 'bg-blue-500'
                        : isPast
                        ? 'bg-emerald-400'
                        : 'bg-zinc-800'
                    }`}
                  />
                  <span className={`text-[9px] font-mono block text-center truncate ${isCurrent ? 'text-blue-400 font-semibold' : isPast ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CURRENT PLAN SECTION */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200">Current Attached Plan</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Coordinated possession plan linked directly to this request</p>
          </div>
          {task.current_plan && (
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
              v{task.current_plan.version || 1}
            </span>
          )}
        </div>

        {task.current_plan ? (
          <div className="p-4 rounded-md bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-medium text-sm text-blue-400">
                  {task.current_plan.plan_number || `PLAN-2026-${task.current_plan.plan_id}`} (Version {task.current_plan.version || 1})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                  {task.current_plan.status}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Scheduled Window: <strong className="font-mono text-zinc-100">14:00 – 16:30</strong> (2.5 hours multi-department coordinated block)
              </p>
            </div>

            <Link
              to={`/plans/${task.current_plan.plan_id}`}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm shrink-0 self-end sm:self-center transition-colors"
            >
              <span>View Plan</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-md bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-xs text-zinc-200">No Plan Generated Yet</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Run the Google OR-Tools CP-SAT engine to find optimal multi-crew windows and link this request.
              </p>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm shrink-0 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
              <span>{generatingPlan ? 'Generating Plan...' : 'Generate AI Plan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ONE REQUEST TRACE */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200">Request Audit Trace</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Immutable database-recorded lifecycle events with actual timestamps</p>
          </div>
          <History className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
          {trace && trace.length > 0 ? (
            trace.map((tr: any, idx: number) => (
              <div key={idx} className="relative group text-xs">
                <div className="absolute -left-[23px] top-0.5 w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover:bg-blue-500 transition-colors" />
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="font-medium text-zinc-200 flex items-center space-x-2">
                    <span className="font-mono text-zinc-500 text-[11px] font-normal">{tr.time}</span>
                    <span>{tr.action}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{tr.status}</span>
                </div>
                {tr.detail && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 pl-9">{tr.detail}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-500 italic">No trace history recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
