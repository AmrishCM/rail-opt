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
  Sliders,
  Check,
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

    const loadPlan = async () => {
      setLoadingPlan(true)
      setActionError(null)
      setActionSuccess(null)
      try {
        const res = await fetchIssueAiPlan(selectedTaskId)
        setPlanData(res)

        // Fetch version history
        try {
          const vRes = await api.get(`/workflow/tasks/${selectedTaskId}/versions`)
          setVersions(vRes.data?.versions || [])
        } catch {
          setVersions([])
        }
      } catch (err) {
        console.error('Failed to fetch AI plan for issue:', err)
        setActionError('Failed to load AI maintenance plan for selected issue.')
      } finally {
        setLoadingPlan(false)
      }
    }

    loadPlan()
  }, [selectedTaskId])

  // Handle Approve & Assign
  const handleApproveAndAssign = async () => {
    if (!selectedTaskId) return
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const payload: any = {}
      if (selectedEngineerId) payload.engineer_id = selectedEngineerId
      if (customComment) payload.comments = customComment

      await approveIssuePlan(selectedTaskId, payload)
      setActionSuccess('Plan successfully approved and scheduled on operational timetable.')
      setModifyModalOpen(false)
      setCustomComment('')
      await loadTasks()
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to approve and assign issue.')
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Operations Planning &bull; Decision Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 mt-1">
            Issue Approval &amp; AI Maintenance Planning
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automated conflict-aware scheduling, constraint validation, and possession assignment
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/manager/timetable"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>View Timetable</span>
          </Link>
          <Link
            to="/manager/replan"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
            <span>Replanning Center</span>
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>{actionSuccess}</span>
          </div>
          <Link
            to="/manager/timetable"
            className="text-xs font-mono text-emerald-300 underline hover:text-emerald-200 ml-4 shrink-0"
          >
            Inspect Timetable &rarr;
          </Link>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.5} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Issues Awaiting Plan (4 Cols) */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-xs font-mono uppercase text-zinc-300 tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
              <span>Pending Planning ({tasks.length})</span>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              AI Priority Queue
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80 max-h-[720px] overflow-y-auto">
            {loadingTasks ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading defect queue...
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No issues currently awaiting maintenance planning.
              </div>
            ) : (
              tasks.map((t) => {
                const isSelected = selectedTaskId === t.task_id
                return (
                  <button
                    key={t.task_id}
                    onClick={() => setSelectedTaskId(t.task_id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col space-y-2 border-l-2 ${
                      isSelected
                        ? 'bg-blue-500/10 border-l-blue-500'
                        : 'hover:bg-zinc-800/50 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-400">
                        {t.reference_no || `ISS-${t.task_id}`}
                      </span>
                      <PriorityBadge level={t.priority_level || 'HIGH'} />
                    </div>

                    <div className="text-xs font-medium text-zinc-200 line-clamp-1">
                      {t.defect_type || t.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                        <span className="truncate max-w-[140px]">{t.location || 'Section C2'}</span>
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center text-zinc-400 text-xs">
              Select an issue from the queue to view AI recommended planning and conflict analysis.
            </div>
          ) : loadingPlan ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-16 text-center text-zinc-400 text-xs">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Evaluating railway timetable, track availability &amp; running optimization engine...
            </div>
          ) : !planData ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center text-zinc-400 text-xs">
              Unable to load planning analysis for this issue.
            </div>
          ) : (
            <>
              {/* 1. ISSUE INFORMATION BOX */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-zinc-200 tracking-wider">
                    Issue Intelligence
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Reported By: <strong className="text-zinc-200">{planData.reported_by}</strong>
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Awaiting AI Plan
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-zinc-900 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Issue ID</span>
                    <span className="font-mono font-semibold text-blue-400 text-sm">{planData.issue_id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Asset</span>
                    <span className="font-medium text-zinc-200">{planData.asset}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Location</span>
                    <span className="text-zinc-200">{planData.location}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Severity / Safety</span>
                    <span className="font-medium text-red-400">
                      {planData.severity} (Safety: {planData.safety_impact})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase block">Operational Impact</span>
                    <span className="font-medium text-amber-400">{planData.operational_impact}</span>
                  </div>
                </div>

                <div className="px-4 pb-3 text-xs text-zinc-300 bg-zinc-950/40 pt-2 border-t border-zinc-800">
                  <strong className="text-zinc-400">Defect Details:</strong> {planData.description}
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Plan Evolution &amp; Replan History ({versions.length} versions)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      Superseded Baseline
                    </span>
                  </div>
                  <div className="space-y-2">
                    {versions.map((v: any) => (
                      <div
                        key={v.plan_id}
                        className={`p-3 rounded-md border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          v.is_active
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-zinc-100">Version {v.version}</span>
                            <span className="font-mono text-[10px] text-blue-400">({v.plan_number})</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 uppercase">
                              {v.status}
                            </span>
                          </div>
                          <p className="text-zinc-300 text-xs">
                            Possession Window: <strong className="font-mono text-amber-300">{v.window}</strong> &bull; Assigned: {v.engineer}
                          </p>
                          {v.changes && (
                            <p className="text-[11px] text-zinc-400 italic mt-0.5">
                              {v.changes.join(' • ')}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
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
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-blue-400 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>AI Recommended Plan</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Feasible Window
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Asset:</span>
                      <strong className="text-zinc-100">{planData.recommended_plan?.asset}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Maintenance Window:</span>
                      <strong className="font-mono text-blue-400 text-sm">
                        {planData.recommended_plan?.maintenance_window}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Track Possession:</span>
                      <strong className="text-zinc-100">Track {planData.recommended_plan?.track}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Assigned Engineer:</span>
                      <strong className="text-zinc-100">{planData.recommended_plan?.engineer}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400">Estimated Duration:</span>
                      <strong className="font-mono text-zinc-100">
                        {planData.recommended_plan?.estimated_duration_minutes} minutes
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-zinc-300 uppercase block mb-1">
                      Why this plan?
                    </span>
                    <p className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-md border border-zinc-800 leading-relaxed">
                      {planData.recommended_plan?.reason}
                    </p>
                    <ul className="mt-2 space-y-1 text-[11px] text-zinc-400">
                      {planData.recommended_plan?.reasons?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Operational Conflicts */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-zinc-200 uppercase tracking-wider">
                      <Train className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                      <span>Operational Conflicts</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        planData.operational_conflicts?.conflict_status === 'CONFLICT'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {planData.operational_conflicts?.conflict_status === 'CONFLICT'
                        ? 'CONFLCT DETECTED'
                        : 'CLEAR FOR POSSESSION'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-zinc-950/60 rounded-md border border-zinc-800 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                        Train Traffic in Window
                      </span>
                      {planData.operational_conflicts?.trains?.length === 0 ? (
                        <div className="text-emerald-400 text-xs font-medium">
                          Zero scheduled passenger services in this time window.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {planData.operational_conflicts?.trains?.map((tr: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/60 last:border-0"
                            >
                              <div className="flex items-center space-x-1.5">
                                <Train className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                                <span className="font-mono font-medium text-zinc-200">
                                  Train {tr.train_number}
                                </span>
                              </div>
                              <span className="font-mono text-zinc-400">{tr.time}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  tr.status === 'OVERLAPPING'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {tr.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 bg-zinc-950/60 rounded-md border border-zinc-800">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                        Possession Window
                      </span>
                      <div className="font-mono text-xs font-semibold text-zinc-200 mt-0.5">
                        {planData.operational_conflicts?.maintenance_block}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {planData.operational_conflicts?.conflict_summary}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TIMELINE PREVIEW (TRACKS C1, C2, C3) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-zinc-200 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                    <span>Corridor Timeline Preview (Section Possession Horizon)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    14:00 &mdash; 17:00 (Track Row Simulation)
                  </span>
                </div>

                {/* Miniature Horizontal Gantt */}
                <div className="space-y-2 pt-1">
                  {planData.timeline_preview?.map((track: any) => (
                    <div
                      key={track.track_code}
                      className="flex items-center bg-zinc-950/60 border border-zinc-800 rounded-md p-2.5 text-xs"
                    >
                      <div className="w-16 font-mono font-semibold text-zinc-200 shrink-0 border-r border-zinc-800 pr-2">
                        {track.track_code}
                      </div>

                      <div className="flex-1 relative h-7 bg-zinc-900 mx-3 rounded border border-zinc-800 overflow-hidden flex items-center px-2">
                        {/* Render trains on this track */}
                        {track.trains?.map((tr: any) => (
                          <div
                            key={tr.id}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px] font-medium mr-2 shrink-0"
                          >
                            <Train className="w-2.5 h-2.5 text-blue-400" strokeWidth={1.5} />
                            <span>{tr.train_number}</span>
                          </div>
                        ))}

                        {/* Render proposed maintenance block */}
                        {track.maintenance_blocks?.map((mb: any) => (
                          <div
                            key={mb.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-medium mr-2 shrink-0 border border-amber-500/40"
                          >
                            <Wrench className="w-2.5 h-2.5 text-amber-400" strokeWidth={1.5} />
                            <span>{mb.title}</span>
                          </div>
                        ))}

                        {track.trains?.length === 0 && track.maintenance_blocks?.length === 0 && (
                          <span className="text-[10px] text-zinc-500 font-mono italic">
                            Track clear
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. ACTIONS: [ MODIFY PLAN ] [ REJECT ] [ APPROVE & ASSIGN ] */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors min-h-[38px] flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" strokeWidth={1.5} />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModifyModalOpen(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors min-h-[38px] flex items-center justify-center space-x-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                  <span>Modify Plan</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveAndAssign}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm min-h-[38px] flex items-center justify-center space-x-2"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                  <span>{actionLoading ? 'Publishing Plan...' : 'Approve & Assign'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modify Modal */}
      {modifyModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <span>Modify Maintenance Assignment</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono uppercase text-[10px] mb-1">
                  Assign Engineer Team
                </label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden"
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
                <label className="block text-zinc-400 font-mono uppercase text-[10px] mb-1">
                  Possession Approval Comments
                </label>
                <textarea
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="e.g. Ensure red flag protection at 1200m distance and coordinate with traction controller."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setModifyModalOpen(false)}
                className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveAndAssign}
                disabled={actionLoading}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                {actionLoading ? 'Saving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
              <span>Reject Maintenance Issue</span>
            </h3>

            <div className="text-xs text-zinc-400">
              Please document the technical reason for returning this issue to field inspection.
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Insufficient track defect measurement data or duplicate ticket."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-hidden resize-none"
            />

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
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
