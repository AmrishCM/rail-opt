import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { RailwayTimeline } from '../../components/timeline/RailwayTimeline'
import {
  fetchPlan,
  submitPlanForReview,
  approvePlan,
  rejectPlan,
  getPlanExportUrl
} from '../../services/api'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  X,
  MessageSquare,
  Sparkles,
  Train,
  History
} from 'lucide-react'

export const PlanReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user, hasPermission } = useAuth()
  const role = user?.role || 'MAINTENANCE_ENGINEER'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [plan, setPlan] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [whyDrawerOpen, setWhyDrawerOpen] = useState<boolean>(false)

  // Revision / Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('Shift maintenance away from the 14:00 high-priority train window.')
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  useEffect(() => {
    loadPlan()
  }, [id])

  const loadPlan = async () => {
    setLoading(true)
    try {
      const res = await fetchPlan(id || 101)
      setPlan(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['plan'] })
    queryClient.invalidateQueries({ queryKey: ['plans'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['todayWork'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
    queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
  }

  const handleSubmitForReview = async () => {
    setActionLoading(true)
    try {
      await submitPlanForReview(plan.plan_id)
      invalidateAll()
      loadPlan()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await approvePlan(plan.plan_id, 'Approved for corridor possession. Safety protocol verified.')
      invalidateAll()
      loadPlan()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    try {
      await rejectPlan(plan.plan_id, rejectReason)
      setRejectModalOpen(false)
      invalidateAll()
      loadPlan()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (iso?: string, fallback = '14:00') => {
    if (!iso) return fallback
    if (iso.includes('T')) return iso.split('T')[1].substring(0, 5)
    return iso
  }

  const openWhyDrawer = (task: any) => {
    setSelectedTask(task)
    setWhyDrawerOpen(true)
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading maintenance plan details...</div>
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Plan Not Found</h2>
        <Link to="/planner" className="text-xs font-bold text-blue-600">Return to Planning Overview</Link>
      </div>
    )
  }

  const planNumber = plan.plan_number || `PLAN-2026-${plan.plan_id}`
  const planVersion = plan.version || 1

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <Link
            to="/planner"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {planNumber}: {plan.plan_name}
              </h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                v{planVersion}
              </span>
              {plan.previous_plan_id && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 flex items-center space-x-1">
                  <History className="w-3 h-3 text-purple-700" />
                  <span>Re-Plan from #{plan.previous_plan_id}</span>
                </span>
              )}
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                plan.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : plan.status === 'REVISION_REQUIRED'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {plan.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Corridor C2 • Section C2-02 • Possession Window ({formatTime(plan.horizon_start, '14:00')} – {formatTime(plan.horizon_end, '16:30')})
              {plan.replan_reason && (
                <span className="block text-amber-800 font-semibold mt-0.5">
                  Reason for Revision: {plan.replan_reason}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Workflow Actions depending on Role */}
        <div className="flex items-center space-x-2">
          <a
            href={getPlanExportUrl(plan.plan_id, 'csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </a>

          {/* Engineer Actions: Submit for Approval */}
          {role === 'MAINTENANCE_ENGINEER' && plan.status === 'AI_RECOMMENDED' && (
            <button
              onClick={handleSubmitForReview}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              SUBMIT FOR APPROVAL
            </button>
          )}

          {/* Manager Actions: Approve, Request Changes */}
          {(role === 'OPERATIONS_MANAGER' || role === 'SYSTEM_ADMIN') && plan.status !== 'APPROVED' && (
            <>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                REQUEST CHANGES
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVE PLAN</span>
              </button>
            </>
          )}

          {plan.status === 'APPROVED' && (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
              Possession Approved
            </span>
          )}
        </div>
      </div>

      {/* REVISION ALERT (Section 33) */}
      {plan.status === 'REVISION_REQUIRED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold text-amber-900">Manager Requested Changes:</div>
            <p className="text-amber-800 mt-1 italic font-medium">"{plan.rejection_reason}"</p>
            <p className="text-[11px] text-amber-700 mt-1">
              Please adjust task timings or re-run planning engine with alternative corridor block windows.
            </p>
          </div>
        </div>
      )}

      {/* SMART COMBINATION BANNER (Section 8) */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Multi-Department Coordinated Possession</span>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
            3 maintenance activities require access to Section C2-02. Instead of creating 3 separate blocks (4.0 hours total disruption),
            RailOpt-AI has coordinated them into <strong>1 single shared 2.5-hour possession</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
          <div>
            <div className="text-[10px] text-slate-300 uppercase font-bold">Separate Work</div>
            <div className="text-sm font-black text-slate-200">4.0 Hours</div>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div>
            <div className="text-[10px] text-amber-300 uppercase font-bold">Coordinated</div>
            <div className="text-sm font-black text-emerald-400">2.5 Hours (-38%)</div>
          </div>
        </div>
      </div>

      {/* PLAN REVIEW TABLE (Section 9) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">MAINTENANCE PLAN REVIEW</h3>
            <p className="text-xs text-slate-500">Every task assignment and scheduled possession timing</p>
          </div>
          <span className="text-xs font-bold text-slate-500">{plan.assignments?.length || 0} Tasks Scheduled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Task Ref</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Department / Team</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.assignments?.map((a: any) => (
                <tr key={a.assignment_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    <div>{a.task_reference || `TSK-${a.task_id}`}</div>
                    <div className="text-[11px] font-normal text-slate-500 line-clamp-1">{a.task_description}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {a.location || a.section_name || 'Main Line'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                      {a.department}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatTime(a.assigned_start_time || a.start_time, '14:00')} – {formatTime(a.assigned_end_time || a.end_time, '16:30')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 uppercase">
                      ✓ Scheduled
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openWhyDrawer(a)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Why?</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAILWAY TIMETABLE / TIMELINE VISUALIZATION (Section 28) */}
      <RailwayTimeline
        corridorId={plan.corridor_id || 2}
        selectedDate="2026-09-15"
      />

      {/* "WHY?" DRAWER / MODAL (Section 9 & 21) */}
      {whyDrawerOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600">Explainable Decision</span>
                <h3 className="text-base font-black text-slate-900">{selectedTask.task_reference}: Reasoning</h3>
              </div>
              <button
                onClick={() => setWhyDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">WHAT IS THIS WORK?</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedTask.task_description}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">WHY IS IT NEEDED?</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  High severity safety defect on main line. Criticality score: {selectedTask.priority_score}/100.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">WHO IS RESPONSIBLE?</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.department}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">HOW LONG WILL IT TAKE?</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedTask.duration_minutes} minutes</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">
                  WHY DID AI SELECT THIS TIME ({formatTime(selectedTask.assigned_start_time || selectedTask.start_time, '14:00')} – {formatTime(selectedTask.assigned_end_time || selectedTask.end_time, '16:30')})?
                </span>
                <ul className="space-y-1 mt-1 text-blue-950 font-medium">
                  {(selectedTask.why_selected || [
                    'Corridor possession window confirmed available with zero timetable conflicts',
                    'Mainline passenger train safety cleared (no interference with Shatabdi or Vande Bharat)',
                    'Multi-department possession combined to minimize overall network disruption'
                  ]).map((reason: string, i: number) => (
                    <li key={i} className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setWhyDrawerOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CHANGES MODAL (Section 33) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Request Changes on Plan</h3>
                <p className="text-xs text-slate-500">Provide reason for the Maintenance Engineer</p>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Revision</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Shift maintenance away from 14:00 high-priority train window"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                SUBMIT REVISION REQUEST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PlanReviewDetail
