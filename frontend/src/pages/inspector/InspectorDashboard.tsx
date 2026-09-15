import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchTasks, fetchTodayWork, fetchNotifications } from '../../services/api'
import { EmptyState } from '../../components/common/EmptyState'
import {
  PlusCircle,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  Train,
  MapPin,
  RefreshCw,
  Eye
} from 'lucide-react'

export const InspectorDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [todayWork, setTodayWork] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, workRes, notifsRes] = await Promise.all([
        fetchTasks({ my_issues: true, page_size: 50 }),
        fetchTodayWork(),
        fetchNotifications()
      ])
      setTasks(tasksRes?.items || [])
      setTodayWork(workRes || [])
      setNotifications(notifsRes?.items || [])
    } catch (err) {
      console.error('Failed to load inspector dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Real data derivations
  const reportedIssues = tasks.length
  const pendingReview = tasks.filter(t => t.status === 'NEW' || t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW').length
  const completedToday = tasks.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length
  const activeIssues = tasks.filter(t => t.status !== 'CLOSED' && t.status !== 'REJECTED').length

  const nextInspection = todayWork.length > 0 ? todayWork[0] : null
  const urgentNotifs = notifications.filter(n => !n.is_read).slice(0, 3)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Field Operations Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Inspector Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational monitoring for <span className="text-slate-200 font-semibold">{user?.full_name || 'Inspector'}</span> • Section {user?.section_code || 'Salem–Erode (C2-02)'}
          </p>
        </div>

        {/* Prominent + REPORT ISSUE Button (Requirement 4 & 27: 44px touch target) */}
        <Link
          to="/inspector/report-issue"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 min-h-[44px] shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-slate-950" />
          <span>+ REPORT ISSUE</span>
        </Link>
      </div>

      {/* Operational Inspection Highlights (Requirement 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Scheduled Inspection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Next Inspection</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          {nextInspection ? (
            <div>
              <div className="text-xl font-black text-white font-mono">
                {nextInspection.start_time ? new Date(nextInspection.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}
              </div>
              <div className="text-xs text-slate-300 font-semibold mt-1">
                {nextInspection.section_name || 'Salem → Erode'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Track: <span className="text-blue-400 font-bold">{nextInspection.track_number || '2'}</span> • Status: <span className="text-emerald-400 font-semibold">{nextInspection.status || 'Scheduled'}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2">
              <p className="font-semibold text-slate-300">Salem → Erode Section</p>
              <p className="text-[11px] text-slate-500 mt-1">Track: 2 • Status: Ready</p>
              <p className="text-[10px] text-slate-500 mt-1">No pending inspection alerts</p>
            </div>
          )}
        </div>

        {/* Active Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Active Issues</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {activeIssues}
          </div>
          <div className="text-[11px] text-slate-400">
            Field defects awaiting resolution
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400 font-mono">
            {pendingReview}
          </div>
          <div className="text-[11px] text-slate-400">
            Awaiting Manager verification
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">
            {completedToday}
          </div>
          <div className="text-[11px] text-slate-400">
            Resolved & track possession cleared
          </div>
        </div>
      </div>

      {/* Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Recent Reported Issues (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                My Reported Issues
              </h2>
              <p className="text-xs text-slate-400">Track faults and maintenance requests submitted by you</p>
            </div>
            <Link
              to="/inspector/issues"
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading reported issues...
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No reported issues"
              description="You have not submitted any track defect or maintenance issues yet."
              actionText="+ Report Issue"
              onAction={() => navigate('/inspector/report-issue')}
            />
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.task_id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-400">
                        {task.reference_no || `TASK-${task.task_id}`}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        task.status === 'RESOLVED' || task.status === 'CLOSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : task.status === 'APPROVED' || task.status === 'SCHEDULED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {task.status?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Sev {task.severity || '3'}/5
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {task.defect_type || task.description}
                    </p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{task.location_name || task.section_code || 'Salem–Erode'} (Track {task.track || '2'})</span>
                      </span>
                      <span>•</span>
                      <span>{task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Today'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to={`/tasks/${task.task_id}`}
                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Urgent Notifications & Today's Timetable Quick View */}
        <div className="space-y-6">
          {/* Urgent Notifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-black text-white uppercase tracking-wider">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Urgent Notifications</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                {urgentNotifs.length}
              </span>
            </div>

            {urgentNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No urgent notifications</p>
            ) : (
              <div className="space-y-2.5">
                {urgentNotifs.map((n) => (
                  <div
                    key={n.notification_id}
                    className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{n.title}</span>
                      <span className="text-[9px] text-slate-400">
                        {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timetable Quick Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2 text-xs font-black text-white uppercase tracking-wider">
                <Train className="w-4 h-4 text-blue-400" />
                <span>Today's Timetable</span>
              </div>
              <Link
                to="/inspector/timetable"
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                Full Schedule →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">12675 Kovai Express</div>
                  <div className="text-[11px] text-slate-400">Salem Jn → Erode Jn</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-emerald-400 font-bold">11:15</div>
                  <div className="text-[10px] text-slate-400">Track 1</div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">20643 Vande Bharat</div>
                  <div className="text-[11px] text-slate-400">Coimbatore Jn → Chennai</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-emerald-400 font-bold">13:40</div>
                  <div className="text-[10px] text-slate-400">Track 2</div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <div className="font-bold text-amber-300">MAINT-BLK-04 (Track Block)</div>
                  <div className="text-[11px] text-slate-400">Welding Possession</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-amber-400 font-bold">14:00 - 16:30</div>
                  <div className="text-[10px] text-amber-300/80">Track 2 Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InspectorDashboard
