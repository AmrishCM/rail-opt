import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchTodayWork,
  startTaskWork,
  resolveTaskWork
} from '../../services/api'
import { EmptyState } from '../../components/common/EmptyState'
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  CheckSquare,
  PlusCircle,
  Calendar,
  MapPin,
  Train,
  ArrowRight,
  Hammer
} from 'lucide-react'

export const EngineerDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([])
  const [todayWork, setTodayWork] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, workRes] = await Promise.all([
        fetchTasks({ assigned_to_me: true, page_size: 50 }),
        fetchTodayWork()
      ])
      setTasks(tasksRes?.items || [])
      setTodayWork(workRes || [])
    } catch (err) {
      console.error('Failed to load engineer dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Real data derivations
  const pendingWork = tasks.filter(t => t.status === 'APPROVED' || t.status === 'SCHEDULED')
  const activeJobs = tasks.filter(t => t.status === 'IN_PROGRESS')
  const completedWork = tasks.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
  const urgentTasks = tasks.filter(t => (t.severity || 0) >= 4 && t.status !== 'RESOLVED' && t.status !== 'CLOSED')

  // Top active or pending task
  const topTask = activeJobs.length > 0 ? activeJobs[0] : pendingWork.length > 0 ? pendingWork[0] : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">Maintenance Execution Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 mt-1">Engineer Work Station</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Operational queue for <span className="text-zinc-200 font-medium">{user?.full_name || 'Maintenance Engineer'}</span> &bull; Department: <span className="text-zinc-200 font-medium">{user?.department || 'Civil Track'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/engineer/report-issue"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shrink-0 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
            <span>+ Report Issue</span>
          </Link>
        </div>
      </div>


      {/* Primary Hero Section: "What work do I need to complete?" (Section 13) */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
          Current Assignment & Target ETA
        </div>

        {topTask ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black text-amber-400">
                  {topTask.reference_no || `TASK-${topTask.task_id}`}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  topTask.status === 'IN_PROGRESS' ? 'bg-amber-500 text-slate-950' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  Status: {topTask.status?.replace('_', ' ')}
                </span>
                <span className="text-xs text-red-400 font-bold">
                  Priority: Sev {topTask.severity || 3}/5
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                {topTask.defect_type || topTask.description}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono">
                <div>Section: <strong className="text-white font-sans">{topTask.location_name || 'Salem–Erode'}</strong></div>
                <div>•</div>
                <div>Track: <strong className="text-blue-400">{topTask.track || '2 (Down Line)'}</strong></div>
                <div>•</div>
                <div>ETA Window: <strong className="text-emerald-400 font-bold">14:00 – 16:30</strong></div>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <Link
                to="/engineer/pending-work"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 min-h-[48px]"
              >
                <Hammer className="w-5 h-5 text-slate-950" />
                <span>[ VIEW WORK & LOG PROGRESS ]</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-400">
            <p className="text-sm font-bold text-white">No active jobs assigned</p>
            <p className="text-[11px] text-slate-500 mt-1">All maintenance work orders assigned to you have been completed and verified.</p>
          </div>
        )}
      </div>

      {/* Operational Numbers (Section 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Work */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Pending Work</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {pendingWork.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Approved tasks awaiting mobilization
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Active Jobs</span>
            <Play className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono">
            {activeJobs.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Work currently in field execution
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Urgent Tasks</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-black text-red-400 font-mono">
            {urgentTasks.length}
          </div>
          <div className="text-[11px] text-slate-400">
            High-priority safety requirements
          </div>
        </div>

        {/* Completed Work */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Completed Work</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {completedWork.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Work cleared with photo evidence
          </div>
        </div>
      </div>

      {/* Two-Column Work View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Assigned Work Items */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Assigned Work Orders
              </h2>
              <p className="text-xs text-slate-400">Track faults dispatched to you by Operations Manager</p>
            </div>
            <Link
              to="/engineer/pending-work"
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading work queue...</div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No assigned work"
              description="You currently have no approved work items assigned to your queue."
            />
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((t) => (
                <div
                  key={t.task_id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-amber-400">
                        {t.reference_no || `TASK-${t.task_id}`}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        t.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20 text-amber-300'
                          : t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {t.status?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sev {t.severity || 3}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white">{t.defect_type || t.description}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{t.location_name || 'Salem–Erode'} (Track {t.track || '2'})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to="/engineer/pending-work"
                      className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors min-h-[40px] flex items-center space-x-1"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Execute</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Timetable & Possession Window Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Assigned Corridor Windows</span>
            </h2>
            <Link to="/engineer/timetable" className="text-xs text-blue-400 hover:text-blue-300 font-bold">
              Full Schedule
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-white">Possession Window (C2-02)</span>
                <span className="text-emerald-400 font-mono font-bold">14:00 – 16:30</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Track 2 closed for Thermit welding gang. Speed restriction 30 km/h after clearance until ultrasonic signoff.
              </p>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-white">Next Passenger Movement</span>
                <span className="text-blue-400 font-mono font-bold">16:45</span>
              </div>
              <p className="text-[11px] text-slate-400">
                12675 Kovai Express on Track 1. Possession must be cleared before 16:35.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EngineerDashboard
