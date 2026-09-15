import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchPlans,
  fetchCriticalEvents,
  fetchTodayWork,
  fetchAuthorities
} from '../../services/api'
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
  PhoneCall,
  ArrowRight,
  ShieldAlert,
  Users,
  Train,
  Check,
  X,
  MessageSquare
} from 'lucide-react'

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [todayWork, setTodayWork] = useState<any[]>([])
  const [authorities, setAuthorities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, plansRes, eventsRes, workRes, authRes] = await Promise.all([
        fetchTasks({ scope: 'approvals', page_size: 50 }),
        fetchPlans({ status: 'MANAGER_APPROVAL' }),
        fetchCriticalEvents(),
        fetchTodayWork(),
        fetchAuthorities().catch(() => [])
      ])
      setTasks(tasksRes?.items || [])
      setPlans(plansRes || [])
      setEvents(eventsRes || [])
      setTodayWork(workRes || [])
      setAuthorities(authRes || [])
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Real operational derivations
  const pendingApprovals = tasks.filter(
    t => t.status === 'NEW' || t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW' || t.status === 'PRIORITIZED'
  )
  const criticalIssues = tasks.filter(t => (t.severity || 0) >= 4)
  const delayedWork = todayWork.filter(w => w.status === 'DELAYED' || w.status === 'BLOCKED')
  const activePossessions = todayWork.filter(w => w.status === 'IN_PROGRESS')
  const replanningNeeded = events.filter(e => e.replan_required || e.status === 'OPEN')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Operations Decision Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Manager Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational command for <span className="text-white font-semibold">{user?.full_name || 'Operations Manager'}</span> • {user?.division_name || 'Northern Trunk Corridor'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/manager/authorities"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors min-h-[44px]"
          >
            <PhoneCall className="w-4 h-4 text-blue-400" />
            <span>Authority Directory</span>
          </Link>
          <Link
            to="/manager/replan"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Replanning</span>
          </Link>
        </div>
      </div>

      {/* HERO DECISION CARD (Requirement 7 & 8: Visually dominant priority action) */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/70 border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
            <span>Action Required Immediately</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {pendingApprovals.length} {pendingApprovals.length === 1 ? 'Issue Awaiting Approval' : 'Issues Awaiting Approval'}
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Field inspectors have submitted defect reports requiring managerial verification, work orders, or corridor possessions before execution.
          </p>
        </div>

        <Link
          to="/manager/approvals"
          className="inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base transition-all shadow-lg shadow-blue-600/30 active:scale-95 shrink-0 min-h-[48px]"
        >
          <span>[ REVIEW & APPROVE ]</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Decision Priority Sections (Requirement 7: Focused, not 15+ cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Critical Issues (Sev 4-5)</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400 font-mono">
            {criticalIssues.length}
          </div>
          <div className="text-[11px] text-slate-400">
            High risk to line operations & timetable
          </div>
        </div>

        {/* Active Blocks / Possessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Active Possessions</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {activePossessions.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Work gangs currently holding track possession
          </div>
        </div>

        {/* Delayed / Blocked Work */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Delayed Work</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {delayedWork.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Exceeding planned clearance window
          </div>
        </div>

        {/* Replanning Required */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Replanning Required</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono">
            {replanningNeeded.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Train path conflicts requiring rescheduling
          </div>
        </div>
      </div>

      {/* Two-Column Decision Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issues Awaiting Approval Queue Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Pending Approval Queue
              </h2>
              <p className="text-xs text-slate-400">Review severity, affected timetable, and assign engineers</p>
            </div>
            <Link
              to="/manager/approvals"
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1"
            >
              <span>Full Workflow Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading issues...</div>
          ) : pendingApprovals.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">No pending approvals</p>
              <p className="text-[11px] text-slate-400">All submitted issues have been reviewed and dispatched.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 4).map((t) => (
                <div
                  key={t.task_id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-400">
                        {t.reference_no || `TASK-${t.task_id}`}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        t.severity >= 4 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        Sev {t.severity || 3} • {t.department || 'TRACK'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        By {t.created_user_name || 'Inspector'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {t.defect_type || t.description}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Location: <span className="text-slate-300 font-semibold">{t.location_name || 'Salem–Erode'}</span> • Track: <span className="text-blue-400 font-semibold">{t.track || '2'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to="/manager/approvals"
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all min-h-[40px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Authority Contacts & Replanning Stream */}
        <div className="space-y-6">
          {/* Quick Authority Contacts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-black text-white uppercase tracking-wider">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Railway Authority Contacts</span>
              </div>
              <Link to="/manager/authorities" className="text-xs text-blue-400 hover:text-blue-300 font-bold">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {authorities.slice(0, 3).map((auth) => (
                <div
                  key={auth.id}
                  className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{auth.role_type}</div>
                    <div className="text-[11px] text-slate-400">{auth.designation}</div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{auth.phone}</div>
                  </div>
                  <Link
                    to="/manager/authorities"
                    className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold"
                  >
                    Contact
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Replanning Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-black text-white uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span>Replanning & Possession</span>
              </div>
              <Link to="/manager/replan" className="text-xs text-blue-400 hover:text-blue-300 font-bold">
                Replan Center
              </Link>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Optimization Engine:</span>
                <span className="text-emerald-400 font-bold font-mono">Google CP-SAT (Active)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Current Window:</span>
                <span className="text-white font-bold">C2-02 (Salem–Erode)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Track Possession:</span>
                <span className="text-amber-400 font-bold">14:00 - 16:30</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
