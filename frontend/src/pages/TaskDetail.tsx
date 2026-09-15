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
    return <div className="p-8 text-center text-xs text-slate-500">Loading maintenance request...</div>
  }

  if (!task) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Maintenance Request Not Found</h2>
        <Link to="/tasks" className="text-xs font-bold text-blue-600">Back to Requests</Link>
      </div>
    )
  }

  const refNo = task.reference_no || `MR-2026-${String(task.task_id).padStart(5, '0')}`
  const statusStr = task.status || 'SUBMITTED'

  // Step indices for Workflow Status Bar (Section 19)
  const steps = [
    { label: 'REPORT', key: 'SUBMITTED' },
    { label: 'AI PLAN', key: 'PLAN_PENDING_REVIEW' },
    { label: 'REVIEW', key: 'PLAN_PENDING_APPROVAL' },
    { label: 'APPROVAL', key: 'APPROVED' },
    { label: 'EXECUTION', key: 'IN_PROGRESS' },
    { label: 'COMPLETION', key: 'COMPLETED' }
  ]

  const getStepIndex = (status: string) => {
    if (status === 'COMPLETED') return 5
    if (status === 'IN_PROGRESS') return 4
    if (status === 'SCHEDULED' || status === 'APPROVED') return 3
    if (status === 'PLAN_PENDING_APPROVAL' || status === 'MANAGER_APPROVAL') return 2
    if (status === 'PLAN_PENDING_REVIEW' || status === 'AI_RECOMMENDED') return 1
    return 0
  }

  const currentStepIdx = getStepIndex(statusStr)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card (Section 20) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              to="/tasks"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Maintenance Request {refNo}
                </h1>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                  statusStr === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : statusStr === 'IN_PROGRESS'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {statusStr}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  (task.priority_score || 0) >= 80 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  Priority {task.priority_score || 75}/100 ({task.priority_level || 'HIGH'})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {task.department} • Asset: {task.asset_name || `Asset #${task.asset_id}`} • Location: {task.asset_location}
              </p>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Reported At</span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {task.reported_at ? new Date(task.reported_at).toLocaleString() : '15 Sep 2026 09:15'}
            </span>
          </div>
        </div>

        {/* WORKFLOW STATUS BAR (Section 19) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            {steps.map((s, idx) => {
              const isDone = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center relative">
                  <div className="flex items-center w-full">
                    {idx > 0 && (
                      <div className={`h-1 flex-1 ${idx <= currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    )}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? '✓' : isCurrent ? '●' : '○'}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-1 flex-1 ${idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 uppercase ${
                    isCurrent ? 'text-blue-700' : isDone ? 'text-emerald-800' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CURRENT PLAN SECTION (Section 20 & 45) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase">CURRENT ATTACHED PLAN</h3>
            <p className="text-xs text-slate-500">Coordinated possession plan linked directly to this request</p>
          </div>
          {task.current_plan && (
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
              v{task.current_plan.version || 1}
            </span>
          )}
        </div>

        {task.current_plan ? (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm text-blue-950">
                  {task.current_plan.plan_number || `PLAN-2026-${task.current_plan.plan_id}`} (Version {task.current_plan.version || 1})
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  {task.current_plan.status}
                </span>
              </div>
              <p className="text-xs text-blue-900">
                Scheduled Window: <strong>14:00 – 16:30</strong> (2.5 hours multi-department coordinated block)
              </p>
            </div>

            <Link
              to={`/plans/${task.current_plan.plan_id}`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs shrink-0 self-end sm:self-center"
            >
              <span>VIEW PLAN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-xs text-slate-900">No Plan Generated Yet</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Run the Google OR-Tools CP-SAT engine to find optimal multi-crew windows and link this request.
              </p>
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{generatingPlan ? 'Generating Plan...' : 'GENERATE AI PLAN'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ONE REQUEST TRACE (Section 55) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase">REQUEST AUDIT TRACE</h3>
            <p className="text-xs text-slate-500">Immutable database-recorded lifecycle events with actual timestamps</p>
          </div>
          <History className="w-4 h-4 text-slate-400" />
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {trace && trace.length > 0 ? (
            trace.map((tr: any, idx: number) => (
              <div key={idx} className="relative group text-xs">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white group-hover:bg-blue-600 transition-colors" />
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="font-mono text-slate-500 text-[11px] font-normal">{tr.time}</span>
                    <span>{tr.action}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{tr.status}</span>
                </div>
                {tr.detail && (
                  <p className="text-[11px] text-slate-500 mt-0.5 pl-9">{tr.detail}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic">No trace history recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
export default TaskDetail
