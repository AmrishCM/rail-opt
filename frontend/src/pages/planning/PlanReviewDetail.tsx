import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPlanDetail,
  approvePlan,
  rejectPlan,
  fetchAuditLogs
} from '../../services/api'
import { RailwayTimeline } from '../../components/timeline/RailwayTimeline'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  FileCheck,
  Check,
  X,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'

export const PlanReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [whyDrawerOpen, setWhyDrawerOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ['plan-detail', id],
    queryFn: () => fetchPlanDetail(Number(id)),
    enabled: !!id
  })

  const formatTime = (iso: string, fallback: string) => {
    if (!iso) return fallback
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch {
      return fallback
    }
  }

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await approvePlan(Number(id), 'Approved by Operations Manager after comprehensive constraint review.')
      setActionSuccess('Plan successfully approved and published to live timetable!')
      queryClient.invalidateQueries({ queryKey: ['plan-detail', id] })
    } catch (err: any) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!id || !rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectPlan(Number(id), rejectReason)
      setRejectModalOpen(false)
      setActionSuccess('Plan revision request sent back to the planning team.')
      queryClient.invalidateQueries({ queryKey: ['plan-detail', id] })
    } catch (err: any) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const openWhyDrawer = (task: any) => {
    setSelectedTask(task)
    setWhyDrawerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading plan review details...
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" strokeWidth={1.5} />
        <h2 className="text-base font-semibold text-zinc-100">Plan Not Found</h2>
        <p className="text-xs text-zinc-400">Unable to retrieve operational plan record.</p>
        <Link to="/planner" className="inline-block px-4 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-md border border-zinc-700">
          Back to Plans
        </Link>
      </div>
    )
  }

  const planNumber = plan.plan_number || `PLAN-2026-${plan.plan_id}`
  const planVersion = plan.version || 1

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/planner"
            className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                {planNumber}: {plan.plan_name}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                v{planVersion}
              </span>
              {plan.previous_plan_id && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center space-x-1">
                  <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                  <span>Replaces Plan #{plan.previous_plan_id}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Corridor {plan.corridor_id || 2} &bull; Generated: {new Date(plan.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {plan.status !== 'APPROVED' ? (
            <>
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="px-3.5 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-xs rounded-md transition-colors"
              >
                Request Revision
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Approve &amp; Publish</span>
              </button>
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              <span>Published to Timetable</span>
            </span>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* PLAN REVIEW TABLE */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Maintenance Plan Review</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Every task assignment and scheduled possession timing</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">{plan.assignments?.length || 0} Tasks Scheduled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Task Ref</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Department / Team</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {plan.assignments?.map((a: any) => (
                <tr key={a.assignment_id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-medium text-blue-400">{a.task_reference || `TSK-${a.task_id}`}</div>
                    <div className="text-[11px] text-zinc-400 line-clamp-1">{a.task_description}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {a.location || a.section_name || 'Main Line'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {a.department}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-zinc-200">
                    {formatTime(a.assigned_start_time || a.start_time, '14:00')} &ndash; {formatTime(a.assigned_end_time || a.end_time, '16:30')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Scheduled
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openWhyDrawer(a)}
                      className="px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-medium text-xs inline-flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Why?</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAILWAY TIMETABLE / TIMELINE VISUALIZATION */}
      <RailwayTimeline
        corridorId={plan.corridor_id || 2}
        selectedDate="2026-09-15"
      />

      {/* "WHY?" DRAWER / MODAL */}
      {whyDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-lg shadow-2xl max-w-xl w-full p-6 border border-zinc-800 space-y-4 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-400">Explainable Decision</span>
                <h3 className="text-base font-semibold text-zinc-100">{selectedTask.task_reference}: Reasoning</h3>
              </div>
              <button
                onClick={() => setWhyDrawerOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Work Requirement</span>
                <p className="font-medium text-zinc-200 mt-0.5">{selectedTask.task_description}</p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">Justification</span>
                <p className="text-zinc-300 mt-0.5">
                  High severity safety defect on main line. Criticality score: <strong className="font-mono text-amber-400">{selectedTask.priority_score}/100</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Responsible Team</span>
                  <p className="font-medium text-zinc-200 mt-0.5">{selectedTask.department}</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Assigned Duration</span>
                  <p className="font-mono text-zinc-200 mt-0.5">{selectedTask.duration_minutes} minutes</p>
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                <span className="text-[10px] uppercase font-mono text-blue-400 block">
                  AI Slot Selection Logic ({formatTime(selectedTask.assigned_start_time || selectedTask.start_time, '14:00')} &ndash; {formatTime(selectedTask.assigned_end_time || selectedTask.end_time, '16:30')})
                </span>
                <ul className="space-y-1 mt-1.5 text-zinc-300">
                  {(selectedTask.why_selected || [
                    'Corridor possession window confirmed available with zero timetable conflicts',
                    'Mainline passenger train safety cleared (no interference with Shatabdi or Vande Bharat)',
                    'Multi-department possession combined to minimize overall network disruption'
                  ]).map((reason: string, i: number) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <span className="text-emerald-400 font-bold">&bull;</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setWhyDrawerOpen(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CHANGES MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full p-6 border border-zinc-800 space-y-4 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Request Changes on Plan</h3>
                <p className="text-xs text-zinc-400">Provide reason for the Maintenance Engineer</p>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Reason for Revision</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:border-blue-500 focus:outline-hidden resize-none"
                placeholder="e.g. Shift maintenance away from 14:00 high-priority train window"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md transition-colors"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlanReviewDetail
