import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchTasks, fetchTodayWork, fetchNotifications } from '../../services/api'
import { StatCard, StatsGrid } from '../../components/common/StatCard'
import { StatusBadge, PriorityBadge } from '../../components/common/RailwayBadges'
import { EmptyState } from '../../components/common/EmptyState'
import {
  Plus,
  ArrowRight,
  MapPin,
  Eye,
  Train,
  Bell
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

  // Real operational derivations
  const reportedIssues = tasks.length
  const pendingReview = tasks.filter(
    (t) => t.status === 'NEW' || t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW'
  ).length
  const completedToday = tasks.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED' || t.status === 'VERIFIED'
  ).length
  const activeIssues = tasks.filter((t) => t.status !== 'CLOSED' && t.status !== 'REJECTED').length

  const nextInspection = todayWork.length > 0 ? todayWork[0] : null
  const urgentNotifs = notifications.filter((n) => !n.is_read).slice(0, 3)

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header & Primary Action: Clean Title + Context Subtitle Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Inspector Dashboard</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {user?.section_code || 'Salem–Erode (C2-02)'} • Field Operations • Operational
          </p>
        </div>

        {/* Primary CTA: Electric Blue, Solid Fill, No Glow */}
        <Link
          to="/inspector/report-issue"
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-none active:translate-y-[1px] shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>Report Issue</span>
        </Link>
      </div>

      {/* Standardized Stat Cards Grid (4 Identical Visual Treatments) */}
      <StatsGrid>
        <StatCard
          label="NEXT INSPECTION"
          value={
            nextInspection?.start_time
              ? new Date(nextInspection.start_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '10:30 AM'
          }
          delta={nextInspection?.section_name || 'Track 2 • Salem → Erode'}
          isLoading={loading}
        />
        <StatCard
          label="ACTIVE ISSUES"
          value={activeIssues}
          delta={activeIssues > 0 ? `${activeIssues} awaiting resolution` : 'All issues cleared'}
          urgency={activeIssues > 0 ? 'urgent' : 'normal'}
          isLoading={loading}
        />
        <StatCard
          label="PENDING REVIEW"
          value={pendingReview}
          delta="Awaiting manager verification"
          isLoading={loading}
        />
        <StatCard
          label="COMPLETED TODAY"
          value={completedToday}
          delta="Track possession cleared"
          isLoading={loading}
        />
      </StatsGrid>

      {/* Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reported Issues (2 Cols) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                My Reported Issues
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defects and track issues submitted by your division
              </p>
            </div>
            <Link
              to="/inspector/issues"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          {loading ? (
            /* Loading Skeleton Matching Final Layout */
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-950/60 border border-zinc-800/80 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="h-3.5 w-20 bg-zinc-800 rounded" />
                      <div className="h-3.5 w-16 bg-zinc-800 rounded" />
                    </div>
                    <div className="h-4 w-48 bg-zinc-800 rounded" />
                    <div className="h-3 w-32 bg-zinc-800/60 rounded" />
                  </div>
                  <div className="h-7 w-20 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No reported issues"
              description="No active track defect or maintenance issues recorded on your section."
              actionText="Report Issue"
              onAction={() => navigate('/inspector/report-issue')}
            />
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.task_id}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-zinc-300">
                        {task.reference_no || `TASK-${task.task_id}`}
                      </span>
                      <StatusBadge status={task.status} />
                      <PriorityBadge level={task.severity || '3'} />
                    </div>
                    <p className="text-xs font-medium text-zinc-200">
                      {task.defect_type || task.description}
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                        <span>
                          {task.location_name || task.section_code || 'Salem–Erode'} (Track{' '}
                          {task.track || '2'})
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      to={`/tasks/${task.task_id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors active:translate-y-[1px]"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Notifications & Timetable Quick View */}
        <div className="space-y-6">
          {/* Urgent Notifications */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <Bell className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>Urgent Notifications</span>
              </div>
              {urgentNotifs.length > 0 && (
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono px-2 py-0.5 rounded border border-blue-500/20">
                  {urgentNotifs.length}
                </span>
              )}
            </div>

            {urgentNotifs.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">No active alerts</p>
            ) : (
              <div className="space-y-2.5">
                {urgentNotifs.map((n) => (
                  <div
                    key={n.notification_id}
                    className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-md space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-200 truncate">{n.title}</span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Now'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timetable Quick Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <Train className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>Today's Timetable</span>
              </div>
              <Link
                to="/inspector/timetable"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Schedule →
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800/80 flex justify-between items-center">
                <div>
                  <div className="font-medium text-zinc-200">12675 Kovai Express</div>
                  <div className="text-[11px] text-zinc-400">Salem Jn → Erode Jn</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-zinc-200 font-bold">11:15</div>
                  <div className="text-[10px] text-zinc-400">Track 1</div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800/80 flex justify-between items-center">
                <div>
                  <div className="font-medium text-zinc-200">20643 Vande Bharat</div>
                  <div className="text-[11px] text-zinc-400">Coimbatore Jn → Chennai</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-zinc-200 font-bold">13:40</div>
                  <div className="text-[10px] text-zinc-400">Track 2</div>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800/80 flex justify-between items-center">
                <div>
                  <div className="font-medium text-amber-400">MAINT-BLK-04</div>
                  <div className="text-[11px] text-zinc-400">Track Welding Block</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-amber-400 font-bold">14:00 - 16:30</div>
                  <div className="text-[10px] text-zinc-400">Track 2 Closed</div>
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
