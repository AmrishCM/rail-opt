import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchPlans,
  fetchCriticalEvents,
  fetchTodayWork,
  apiClient
} from '../../services/api'
import {
  Brain,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Wrench,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { PriorityBadge, StatusBadge } from '../../components/common/RailwayBadges'

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [todayWork, setTodayWork] = useState<any[]>([])
  const [delayRequests, setDelayRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, plansRes, eventsRes, workRes, delayRes] = await Promise.all([
        fetchTasks({ scope: 'approvals', page_size: 50 }),
        fetchPlans({ status: 'MANAGER_APPROVAL' }),
        fetchCriticalEvents(),
        fetchTodayWork(),
        apiClient.get('/execution/delay-requests').then((r) => r.data).catch(() => [])
      ])
      setTasks(tasksRes?.items || [])
      setPlans(plansRes || [])
      setEvents(eventsRes || [])
      setTodayWork(workRes || [])
      setDelayRequests(delayRes || [])
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const criticalIssues = tasks.filter((t) => (t.severity || 0) >= 4 || t.priority_score >= 75)
  const pendingReplansCount = delayRequests.length > 0 ? delayRequests.length : events.filter((e) => e.replan_required).length
  const tasksNeedingScheduling = tasks.length > 0 ? tasks.length : 8
  const conflictsDetected = 2

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Railway Operations &bull; Maintenance Planning Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
            Operations Manager Console
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Coordinating corridor maintenance possessions, constraint solver decisions, and real-time conflict mitigations
          </p>
        </div>
        <div className="text-xs text-zinc-400 font-mono bg-zinc-950/60 p-3 rounded-md border border-zinc-800 sm:text-right">
          <div>Corridor: <span className="text-zinc-200 font-medium">Northern Trunk (C2)</span></div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Shift Controller: {user?.full_name || 'Rajesh Sharma'}</div>
        </div>
      </div>

      {/* 2. Central Action Card: AI PLANNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Brain className="w-4 h-4" strokeWidth={1.5} />
              </span>
              <h2 className="text-base font-semibold text-zinc-100 uppercase tracking-wide">
                AI Maintenance Planner
              </h2>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300 font-medium pl-1">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span><strong className="text-zinc-100 font-mono">{tasksNeedingScheduling}</strong> maintenance tasks require scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span><strong className="text-zinc-100 font-mono">{conflictsDetected}</strong> critical train/possession conflicts detected on Track C2</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>
                  <strong className="text-zinc-100 font-mono">{pendingReplansCount || 1}</strong> engineer delay request pending review
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              to="/manager/approval-planning"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-xs transition-colors shadow-sm tracking-wide"
            >
              <span>Open Approval &amp; Planning</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Operational Decision Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Critical Maintenance Queue */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">Critical Maintenance Queue</h3>
            </div>
            <Link to="/manager/approval-planning" className="text-xs font-medium text-blue-400 hover:text-blue-300">
              Plan All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/80 max-h-[320px] overflow-y-auto">
            {tasks.slice(0, 4).map((t: any, idx: number) => {
              const pLevel = t.priority_score >= 80 ? 'CRITICAL' : 'HIGH'
              return (
                <div key={t.task_id || idx} className="p-3.5 hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-medium text-xs text-blue-400">
                        {t.reference_no || `WO-102${idx + 4}`}
                      </span>
                      <PriorityBadge level={pLevel} />
                      <span className="text-[11px] text-zinc-400 font-mono">{t.department || 'Engineering'}</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-200 line-clamp-1">{t.description}</p>
                    <div className="text-[11px] text-zinc-400">
                      <span>Location: Section C2 &bull; Est. {t.estimated_duration || 45} mins</span>
                    </div>
                  </div>

                  <Link
                    to="/manager/approval-planning"
                    className="px-2.5 py-1 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors"
                  >
                    Schedule
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section B: Pending Replans & Engineer Interruption Requests */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
              <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">Pending Replans &amp; Delay Requests</h3>
            </div>
            <Link to="/manager/replan" className="text-xs font-medium text-blue-400 hover:text-blue-300">
              View Replan Center &rarr;
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {/* Engineer Interruption Card */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-amber-300 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                  <span>WO-1024 &bull; Engineer Arun Delay Request</span>
                </span>
                <span className="text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase">
                  +35 min delay
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                <strong className="text-zinc-200">Reported Problem:</strong> Replacement rail component delayed from yard siding.
              </p>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-amber-500/20">
                <span>Affected Track: <strong className="text-zinc-200">C2</strong> (14:30 &rarr; 15:15)</span>
                <Link
                  to="/manager/replan"
                  className="px-2.5 py-1 bg-blue-600 text-white font-medium rounded-md text-xs hover:bg-blue-500 transition-colors"
                >
                  Review AI Replan
                </Link>
              </div>
            </div>

            {/* Timetable Conflict Alert */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-md space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-zinc-200">Track C2 Possession Conflict</span>
                <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-medium">
                  Overlap 14:45&ndash;14:52
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Train 12675 Kovai Express scheduled through Track C2 during planned maintenance window.
              </p>
              <div className="pt-1 flex justify-end">
                <Link to="/manager/timetable" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                  Resolve in Timeline &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Today's Blocks & Operational Timeline Link */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-md bg-zinc-800 text-zinc-300">
            <Calendar className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">Today's Corridor Possessions (Section C2)</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Coordinated multi-department block authorized from 14:00 to 16:30.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/manager/timetable"
            className="px-3.5 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-medium text-xs rounded-md transition-colors"
          >
            View Live Timetable
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
