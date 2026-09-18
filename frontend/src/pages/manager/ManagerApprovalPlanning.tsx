import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api, {
  fetchTasks,
  fetchIssueAiPlan,
  approveIssuePlan,
  rejectTask,
  fetchUsers
} from '../../services/api'
import IssueStatusWorkflow from '../../components/workflow/IssueStatusWorkflow'
import { PriorityBadge, StatusBadge } from '../../components/common/RailwayBadges'
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  MapPin,
  Train,
  Wrench,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  Check,
  UserCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react'

export const ManagerApprovalPlanning: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [planData, setPlanData] = useState<any | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [engineers, setEngineers] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Modify Modal State
  const [modifyModalOpen, setModifyModalOpen] = useState(false)
  const [selectedEngineerId, setSelectedEngineerId] = useState<number | ''>('')
  const [customComment, setCustomComment] = useState('')

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Load Issues awaiting approval
  const loadTasks = async () => {
    setLoadingTasks(true)
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetchTasks({ scope: 'approvals', page_size: 100 }),
        fetchUsers({ role: 'MAINTENANCE_ENGINEER' }).catch(() => ({ items: [] }))
      ])
      const allItems = tasksRes?.items || []
      const pending = allItems.filter((t: any) =>
        [
          'REPORTED',
          'AI_PLANNING',
          'PLAN_READY',
          'MANAGER_REVIEW',
          'REPLAN_REQUESTED',
          'AI_REPLANNING',
          'NEW',
          'SUBMITTED',
          'UNDER_REVIEW',
          'PRIORITIZED',
          'APPROVED',
          'ASSIGNED'
        ].includes(t.status)
      )
      setTasks(pending.length > 0 ? pending : allItems)
      setEngineers(usersRes?.items || [])
      if (pending.length > 0 && !selectedTaskId) {
        setSelectedTaskId(pending[0].task_id)
      }
    } catch (err) {
      console.error('Failed to load pending issues:', err)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [user])

  // Automatically trigger AI planning when task is selected
  useEffect(() => {
    if (!selectedTaskId) {
      setPlanData(null)
      setVersions([])
      return
    }
    const loadAiPlan = async () => {
      setLoadingPlan(true)
      setActionError(null)
      try {
        const [res, versRes] = await Promise.all([
          fetchIssueAiPlan(selectedTaskId),
          api.get(`/planning/issue/${selectedTaskId}/versions`).catch(() => ({ data: { versions: [] } }))
        ])
        setPlanData(res)
        setVersions(versRes?.data?.versions || [])
        if (res.recommended_plan?.engineer_id) {
          setSelectedEngineerId(res.recommended_plan.engineer_id)
        }
      } catch (err: any) {
        console.error('Failed to generate AI plan for issue:', err)
        setActionError('Failed to generate AI candidate plan for selected issue.')
      } finally {
        setLoadingPlan(false)
      }
    }
    loadAiPlan()
  }, [selectedTaskId])

  // Handle Approve & Assign
  const handleApproveAndAssign = async () => {
    if (!selectedTaskId) return
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await approveIssuePlan(selectedTaskId, {
        comments: customComment || 'Approved for corridor possession after AI conflict analysis.',
        assigned_engineer_id: selectedEngineerId ? Number(selectedEngineerId) : undefined
      })
      setActionSuccess(
        `Plan approved! ${res.work_order_id || 'Work Order'} created for window ${res.assigned_window}. Timetable updated.`
      )
      setModifyModalOpen(false)
      // Refresh tasks list
      await loadTasks()
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve and assign plan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Reject
  const handleReject = async () => {
    if (!selectedTaskId || !rejectReason.trim()) {
      setActionError('Rejection reason is mandatory.')
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await rejectTask(selectedTaskId, { reason: rejectReason })
      setActionSuccess('Issue rejected and returned to inspection queue.')
      setRejectModalOpen(false)
      setRejectReason('')
      await loadTasks()
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to reject issue.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Institutional Top Header */}
      <div className="bg-white border border-[#d7dde1] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#8f1d2c] font-black text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Operations Planning & Decision Control</span>
          </div>
          <h1 className="text-2xl font-black text-[#172027] mt-1">
            Issue Approval & AI Maintenance Planning
          </h1>
          <p className="text-xs text-[#59636b] mt-0.5">
            Automated conflict-aware scheduling, constraint validation, and possession assignment
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/manager/timetable"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172027] text-xs font-bold border border-[#d7dde1] transition-all"
          >
            <Calendar className="w-4 h-4 text-[#8f1d2c]" />
            <span>View Timetable</span>
          </Link>
          <Link
            to="/manager/replan"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172027] text-xs font-bold border border-[#d7dde1] transition-all"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>Replanning Center</span>
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <Link
            to="/manager/timetable"
            className="text-xs font-black underline hover:text-emerald-950 ml-4 shrink-0"
          >
            Inspect Timetable →
          </Link>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Issues Awaiting Plan (3 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#d7dde1] rounded-xl shadow-sm overflow-hidden">
          <div className="p-3.5 bg-[#eef1f3] border-b border-[#d7dde1] flex items-center justify-between">
            <div className="text-xs font-black text-[#172027] uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-[#8f1d2c]" />
              <span>Pending Planning ({tasks.length})</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8f1d2c] text-white">
              AI Priority Queue
            </span>
          </div>

          <div className="divide-y divide-[#d7dde1] max-h-[720px] overflow-y-auto">
            {loadingTasks ? (
              <div className="p-8 text-center text-xs text-[#59636b]">
                <div className="w-6 h-6 border-2 border-[#8f1d2c] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading defect queue...
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#59636b]">
                No issues currently awaiting maintenance planning.
              </div>
            ) : (
              tasks.map((t) => {
                const isSelected = selectedTaskId === t.task_id
                return (
                  <button
                    key={t.task_id}
                    onClick={() => setSelectedTaskId(t.task_id)}
                    className={`w-full text-left p-3.5 transition-all flex flex-col space-y-2 border-l-4 ${
                      isSelected
                        ? 'bg-rose-50/50 border-l-[#8f1d2c]'
                        : 'hover:bg-slate-50 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-[#8f1d2c]">
                        {t.reference_no || `ISS-${t.task_id}`}
                      </span>
                      <PriorityBadge level={t.priority_level || 'HIGH'} />
                    </div>

                    <div className="text-xs font-bold text-[#172027] line-clamp-1">
                      {t.defect_type || t.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#59636b] pt-1 border-t border-slate-100">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[140px]">{t.location || 'Section C2'}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {t.estimated_duration || 90} min
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Area: Selected Issue Intelligence, AI Plan, Conflicts & Timeline Preview (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedTaskId ? (
            <div className="bg-white border border-[#d7dde1] rounded-xl p-12 text-center text-[#59636b] text-xs">
              Select an issue from the queue to view AI recommended planning and conflict analysis.
            </div>
          ) : loadingPlan ? (
            <div className="bg-white border border-[#d7dde1] rounded-xl p-16 text-center text-[#59636b] text-xs">
              <div className="w-8 h-8 border-3 border-[#8f1d2c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Evaluating railway timetable, track availability & running optimization engine...
            </div>
          ) : !planData ? (
            <div className="bg-white border border-[#d7dde1] rounded-xl p-12 text-center text-[#59636b] text-xs">
              Unable to load planning analysis for this issue.
            </div>
          ) : (
            <>
              {/* 1. ISSUE INFORMATION BOX */}
              <div className="bg-white border border-[#d7dde1] rounded-xl shadow-sm overflow-hidden">
                <div className="p-3.5 bg-[#eef1f3] border-b border-[#d7dde1] flex items-center justify-between">
                  <span className="text-xs font-black text-[#172027] uppercase tracking-wider">
                    Issue Intelligence
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-[#59636b]">
                      Reported By: <strong>{planData.reported_by}</strong>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      Awaiting AI Plan
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#59636b] uppercase block">Issue ID</span>
                    <span className="font-mono font-black text-[#8f1d2c] text-sm">{planData.issue_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#59636b] uppercase block">Asset</span>
                    <span className="font-bold text-[#172027]">{planData.asset}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#59636b] uppercase block">Location</span>
                    <span className="text-[#172027]">{planData.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#59636b] uppercase block">Severity / Safety</span>
                    <span className="font-bold text-red-700">
                      {planData.severity} (Safety: {planData.safety_impact})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#59636b] uppercase block">Operational Impact</span>
                    <span className="font-bold text-amber-700">{planData.operational_impact}</span>
                  </div>
                </div>

                <div className="px-4 pb-3 text-xs text-[#172027] bg-slate-50/50 pt-2 border-t border-slate-100">
                  <strong className="text-[#59636b]">Defect Details:</strong> {planData.description}
                </div>
              </div>

              {/* Real Operational Lifecycle Map */}
              <IssueStatusWorkflow
                taskId={selectedTaskId}
                currentStatus={planData.status}
                referenceNo={planData.issue_id}
                compact={true}
              />

              {/* Version History Comparison (if multiple versions exist) */}
              {versions && versions.length > 1 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                      <RotateCcw className="w-4 h-4" />
                      <span>Plan Evolution & Replan History ({versions.length} versions)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      Superseded Baseline
                    </span>
                  </div>
                  <div className="space-y-2">
                    {versions.map((v: any) => (
                      <div
                        key={v.plan_id}
                        className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          v.is_active
                            ? 'bg-blue-900/20 border-blue-500/50 text-blue-200'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">Version {v.version}</span>
                            <span className="font-mono text-[10px] text-blue-400">({v.plan_number})</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                              {v.status}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs">
                            Possession Window: <strong className="font-mono text-amber-300">{v.window}</strong> • Assigned: {v.engineer}
                          </p>
                          {v.changes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              {v.changes.join(' • ')}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {v.approved_at ? new Date(v.approved_at).toLocaleTimeString() : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. AI RECOMMENDED PLAN + OPERATIONAL CONFLICTS (2-COLUMNS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left: AI Recommended Plan */}
                <div className="bg-white border border-[#d7dde1] rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#d7dde1] pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-[#8f1d2c] uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-[#8f1d2c]" />
                      <span>AI Recommended Plan</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Feasible Window
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#59636b]">Asset:</span>
                      <strong className="text-[#172027]">{planData.recommended_plan?.asset}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#59636b]">Maintenance Window:</span>
                      <strong className="font-mono text-[#8f1d2c] text-sm">
                        {planData.recommended_plan?.maintenance_window}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#59636b]">Track Possession:</span>
                      <strong className="text-[#172027]">Track {planData.recommended_plan?.track}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#59636b]">Assigned Engineer:</span>
                      <strong className="text-[#172027]">{planData.recommended_plan?.engineer}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-[#59636b]">Estimated Duration:</span>
                      <strong className="font-mono text-[#172027]">
                        {planData.recommended_plan?.estimated_duration_minutes} minutes
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-[#172027] uppercase block mb-1">
                      Why this plan?
                    </span>
                    <p className="text-[11px] text-[#59636b] bg-slate-50 p-2.5 rounded-lg border border-[#d7dde1] leading-relaxed">
                      {planData.recommended_plan?.reason}
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-[#59636b]">
                      {planData.recommended_plan?.reasons?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Operational Conflicts */}
                <div className="bg-white border border-[#d7dde1] rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#d7dde1] pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-[#172027] uppercase tracking-wider">
                      <Train className="w-4 h-4 text-slate-700" />
                      <span>Operational Conflicts</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        planData.operational_conflicts?.conflict_status === 'CONFLICT'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {planData.operational_conflicts?.conflict_status === 'CONFLICT'
                        ? '⚠ CONFLICT DETECTED'
                        : '✓ CLEAR FOR POSSESSION'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-[#d7dde1] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-[#59636b] block">
                        Train Traffic in Window
                      </span>
                      {planData.operational_conflicts?.trains?.length === 0 ? (
                        <div className="text-emerald-700 text-xs font-bold">
                          Zero scheduled passenger services in this time window.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {planData.operational_conflicts?.trains?.map((tr: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0"
                            >
                              <div className="flex items-center space-x-1.5">
                                <Train className="w-3 h-3 text-slate-500" />
                                <span className="font-mono font-bold text-[#172027]">
                                  Train {tr.train_number}
                                </span>
                              </div>
                              <span className="font-mono text-slate-600">{tr.time}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  tr.status === 'OVERLAPPING'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {tr.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg border border-[#d7dde1]">
                      <span className="text-[10px] font-bold uppercase text-[#59636b] block">
                        Possession Window
                      </span>
                      <div className="font-mono text-xs font-bold text-[#172027] mt-0.5">
                        {planData.operational_conflicts?.maintenance_block}
                      </div>
                      <p className="text-[11px] text-[#59636b] mt-1">
                        {planData.operational_conflicts?.conflict_summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TIMELINE PREVIEW (TRACKS C1, C2, C3) */}
              <div className="bg-white border border-[#d7dde1] rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#d7dde1] pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-[#172027] uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-[#8f1d2c]" />
                    <span>Corridor Timeline Preview (Section Possession Horizon)</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#59636b]">
                    14:00 — 17:00 (Track Row Simulation)
                  </span>
                </div>

                {/* Miniature Horizontal Gantt */}
                <div className="space-y-2 pt-1">
                  {planData.timeline_preview?.map((track: any) => (
                    <div
                      key={track.track_code}
                      className="flex items-center bg-slate-50 border border-[#d7dde1] rounded-lg p-2.5 text-xs"
                    >
                      <div className="w-16 font-mono font-black text-[#172027] shrink-0 border-r border-[#d7dde1] pr-2">
                        {track.track_code}
                      </div>

                      <div className="flex-1 relative h-7 bg-white mx-3 rounded border border-slate-200 overflow-hidden flex items-center px-2">
                        {/* Render trains on this track */}
                        {track.trains?.map((tr: any) => (
                          <div
                            key={tr.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0f172a] text-white font-mono text-[10px] font-bold mr-2 shrink-0 shadow-sm"
                          >
                            <Train className="w-2.5 h-2.5 text-blue-300" />
                            <span>{tr.train_number}</span>
                          </div>
                        ))}

                        {/* Render proposed maintenance block */}
                        {track.maintenance_blocks?.map((mb: any) => (
                          <div
                            key={mb.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-[#8f1d2c] text-white font-mono text-[10px] font-black mr-2 shrink-0 shadow-sm border border-rose-400 animate-pulse"
                          >
                            <Wrench className="w-2.5 h-2.5 text-amber-300" />
                            <span>{mb.title}</span>
                          </div>
                        ))}

                        {track.trains?.length === 0 && track.maintenance_blocks?.length === 0 && (
                          <span className="text-[10px] text-slate-400 font-mono italic">
                            Track clear
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ACTIONS: [ MODIFY PLAN ] [ REJECT ] [ APPROVE & ASSIGN ] */}
              <div className="bg-white border border-[#d7dde1] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-bold transition-all min-h-[42px] flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4 text-red-700" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModifyModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#d7dde1] bg-slate-100 hover:bg-slate-200 text-[#172027] text-xs font-bold transition-all min-h-[42px] flex items-center justify-center space-x-1.5"
                >
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>Modify Plan</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveAndAssign}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#8f1d2c] hover:bg-[#711522] text-white text-xs font-black transition-all shadow-md min-h-[42px] flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>{actionLoading ? 'Publishing Plan...' : 'Approve & Assign'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modify Modal */}
      {modifyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7dde1] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-[#172027] uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#8f1d2c]" />
              <span>Modify Maintenance Assignment</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#59636b] font-bold uppercase text-[10px] mb-1">
                  Assign Engineer Team
                </label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-[#d7dde1] rounded-lg p-2.5 text-xs font-bold text-[#172027]"
                >
                  <option value="">Auto-Assign (Default Team)</option>
                  {engineers.map((eng) => (
                    <option key={eng.user_id} value={eng.user_id}>
                      {eng.full_name} ({eng.department || 'Track Maintenance'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#59636b] font-bold uppercase text-[10px] mb-1">
                  Possession Approval Comments
                </label>
                <textarea
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="e.g. Ensure red flag protection at 1200m distance and coordinate with traction controller."
                  rows={3}
                  className="w-full bg-white border border-[#d7dde1] rounded-lg p-2.5 text-xs text-[#172027]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModifyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-[#172027] text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveAndAssign}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-[#8f1d2c] text-white text-xs font-black hover:bg-[#711522]"
              >
                {actionLoading ? 'Saving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d7dde1] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-red-900 uppercase tracking-wider flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-red-700" />
              <span>Reject Maintenance Issue</span>
            </h3>

            <div className="text-xs text-[#59636b]">
              Please document the technical reason for returning this issue to field inspection.
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient track defect measurement data or duplicate ticket."
              rows={3}
              className="w-full bg-white border border-[#d7dde1] rounded-lg p-2.5 text-xs text-[#172027]"
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-[#172027] text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-black hover:bg-red-800"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerApprovalPlanning
