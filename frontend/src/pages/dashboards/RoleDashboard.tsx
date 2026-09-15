import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchPlans,
  fetchTodayWork,
  fetchCriticalEvents,
  fetchDatabaseHealth,
  fetchWorkflowDiagnostics
} from '../../services/api'
import { RailwayTimeline } from '../../components/timeline/RailwayTimeline'
import { EmergencyReplanModal } from '../emergency/EmergencyReplanModal'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
  Wrench,
  Train,
  ShieldAlert,
  Calendar,
  ChevronRight,
  Cpu,
  FileCheck,
  AlertOctagon,
  Database,
  RefreshCw,
  PlusCircle
} from 'lucide-react'

export const RoleDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth()
  const role = user?.role || 'MAINTENANCE_ENGINEER'
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [todayWork, setTodayWork] = useState<any[]>([])
  const [criticalEvents, setCriticalEvents] = useState<any[]>([])
  const [dbHealth, setDbHealth] = useState<any | null>(null)
  const [diagnostics, setDiagnostics] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [tasksRes, plansRes, workRes, eventsRes, healthRes, diagRes] = await Promise.all([
        fetchTasks({ page_size: 20 }),
        fetchPlans(),
        fetchTodayWork(),
        fetchCriticalEvents(),
        fetchDatabaseHealth(),
        fetchWorkflowDiagnostics()
      ])
      setTasks(tasksRes?.items || [])
      setPlans(plansRes || [])
      setTodayWork(workRes || [])
      setCriticalEvents(eventsRes || [])
      setDbHealth(healthRes?.database || null)
      setDiagnostics(diagRes || null)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Workflow counts from database state
  const requestsNeedingAttention = tasks.filter((t: any) =>
    t.status === 'SUBMITTED' || t.status === 'OPEN' || t.status === 'PRIORITIZED' || t.status === 'PLAN_PENDING_REVIEW'
  )
  const plansAwaitingApproval = plans.filter((p: any) =>
    p.status === 'MANAGER_APPROVAL' || p.status === 'AI_RECOMMENDED' || p.status === 'REVISION_REQUIRED'
  )
  const scheduledFieldWork = todayWork.filter((w: any) =>
    w.status === 'NOT_STARTED' || w.status === 'IN_PROGRESS' || w.status === 'ASSIGNED'
  )
  const activeCriticalEvents = criticalEvents.filter((e: any) =>
    e.status === 'OPEN' || e.status === 'IMPACT_ASSESSED' || e.replan_required
  )

  // Last updated timestamp from database
  const lastUpdatedStr = diagnostics?.last_updated
    ? new Date(diagnostics.last_updated).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '15 Sep 2026 14:25'

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top System Health & Live DB Status Bar (Section 3 & 25) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-bold">
            <Database className="w-4 h-4 text-slate-700" />
            <span className="text-slate-900">Database:</span>
          </div>
          {dbHealth?.connected ? (
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
              dbHealth?.type === 'postgresql'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span>
                {dbHealth?.type === 'postgresql' ? '● Connected (PostgreSQL)' : '● SQLite Development Mode'}
              </span>
              <span className="text-[10px] opacity-75">({dbHealth?.latency_ms || 3}ms)</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800">
              ● Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <span className="text-slate-500 font-medium">
            Last database update: <strong className="text-slate-800 font-bold">{lastUpdatedStr}</strong>
          </span>
          <button
            onClick={loadDashboardData}
            title="Refetch database state"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 CORE PERSISTENT WORKFLOW CARDS (Section 43) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            RAILOPT-AI CORE WORKFLOW PIPELINE
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Step-by-step persistent railway lifecycle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Report & Plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-sky-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                  STEP 1
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {tasks.length} requests total
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Report & Plan</h3>
              <p className="text-xs text-slate-500 mt-1">
                {requestsNeedingAttention.length} requests need attention or plan generation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <Link
                to="/maintenance/new"
                className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Defect</span>
              </Link>
              <Link
                to="/tasks"
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
              >
                OPEN
              </Link>
            </div>
          </div>

          {/* Card 2: Review & Approve */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  STEP 2
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {plans.length} plans total
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Review & Approve</h3>
              <p className="text-xs text-slate-500 mt-1">
                {plansAwaitingApproval.length} plan(s) awaiting managerial review and corridor possession sign-off.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {plansAwaitingApproval[0] ? `Plan #${plansAwaitingApproval[0].plan_id}` : 'All caught up'}
              </span>
              <Link
                to={plansAwaitingApproval[0] ? `/plans/${plansAwaitingApproval[0].plan_id}` : '/planner'}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                OPEN
              </Link>
            </div>
          </div>

          {/* Card 3: Execute Field Work */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  STEP 3
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Section C2-02
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Execute Field Work</h3>
              <p className="text-xs text-slate-500 mt-1">
                {scheduledFieldWork.length} maintenance tasks scheduled today for field gang execution.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">
                14:00 – 16:30 Possession
              </span>
              <Link
                to="/execution"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              >
                OPEN
              </Link>
            </div>
          </div>

          {/* Card 4: Critical Events & Re-Plan (Section 18 & 43) */}
          <div className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
            activeCriticalEvents.length > 0
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-300/40'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  activeCriticalEvents.length > 0 ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-700'
                }`}>
                  STEP 4
                </span>
                {activeCriticalEvents.length > 0 ? (
                  <span className="text-[10px] font-extrabold text-rose-800 animate-pulse">
                    ⚠ REPLAN REQUIRED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">
                    Normal Operations
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Report Critical Defect & Re-Plan</h3>
              <p className="text-xs text-slate-600 mt-1">
                {activeCriticalEvents.length > 0
                  ? `${activeCriticalEvents.length} critical defect(s) require automated CP-SAT replanning.`
                  : 'For unexpected urgent track, signal, or OHE failure events.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="w-full px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{activeCriticalEvents.length > 0 ? 'VIEW IMPACT & REPLAN' : 'REPORT CRITICAL DEFECT'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* "ACTION REQUIRED" (What do I need to do now? - Section 44) */}
      <div className="bg-white rounded-2xl border-2 border-amber-400/40 p-5 shadow-sm bg-gradient-to-br from-white to-amber-50/20 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black">
              !
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                ACTION REQUIRED TODAY
              </h2>
              <p className="text-xs text-slate-500">
                Prioritized items requiring your immediate attention based on role ({role.replace(/_/g, ' ')})
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200">
            Immediate Response
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Action 1: Approve Plan */}
          {plansAwaitingApproval.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700">PLAN APPROVAL REQUIRED</span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                  Approve Plan {plansAwaitingApproval[0].plan_number || `#${plansAwaitingApproval[0].plan_id}`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Corridor C2 multi-crew block scheduled for 14:00–16:30.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-100 flex justify-end">
                <Link
                  to={`/plans/${plansAwaitingApproval[0].plan_id}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1"
                >
                  <span>REVIEW & APPROVE</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Action 2: Field Work */}
          {scheduledFieldWork.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700">FIELD EXECUTION SCHEDULED</span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                  Start Task {scheduledFieldWork[0].reference_no || `Task #${scheduledFieldWork[0].task_id}`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {scheduledFieldWork[0].task_description} • Section C2-02
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-100 flex justify-end">
                <Link
                  to="/execution"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
                >
                  <span>START WORK</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Action 3: Review Critical Defect / Report */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-rose-700">EMERGENCY PROTOCOL</span>
              <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                {activeCriticalEvents.length > 0
                  ? `Review ${activeCriticalEvents[0].event_number}`
                  : 'Report Unplanned Critical Defect'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {activeCriticalEvents.length > 0
                  ? activeCriticalEvents[0].description
                  : 'Triggers instant timetable impact analysis and CP-SAT replanner.'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-100 flex justify-end">
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center space-x-1"
              >
                <span>{activeCriticalEvents.length > 0 ? 'REPLAN NOW' : 'REPORT DEFECT'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CORRIDOR INTELLIGENCE TIMETABLE (Embedded Live on Dashboard) */}
      <RailwayTimeline
        corridorId={2}
        selectedDate="2026-09-15"
        onSelectPlan={(pid) => navigate(`/plans/${pid}`)}
      />

      {/* Emergency Replan Modal Component */}
      <EmergencyReplanModal
        isOpen={isEmergencyModalOpen}
        onClose={() => {
          setIsEmergencyModalOpen(false)
          loadDashboardData()
        }}
      />
    </div>
  )
}
export default RoleDashboard
