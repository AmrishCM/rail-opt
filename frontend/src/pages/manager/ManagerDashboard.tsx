import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchPlans,
  fetchCriticalEvents,
  fetchTodayWork,
  fetchAuthorities,
  apiClient
} from '../../services/api'
import {
  Brain,
  CheckCircle2,
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
      {/* 1. Top Section: Railway Operations Maintenance Planning Control (Part 6) */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rail-maroon font-mono">
            RAILWAY OPERATIONS
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Maintenance Planning Control
          </h1>
        </div>
        <div className="text-xs text-slate-500 font-medium sm:text-right">
          <span>Operational Division: </span>
          <strong className="text-slate-800">Northern Trunk Corridor (C2)</strong>
          <div className="text-[11px] font-mono text-slate-400">Shift Controller: {user?.full_name || 'Rajesh Sharma'}</div>
        </div>
      </div>

      {/* 2. Central Action Card: AI PLANNER (Part 6) */}
      <div className="bg-white border-2 border-rail-maroon/80 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-md bg-rose-50 text-rail-maroon border border-rose-200">
                <Brain className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                AI MAINTENANCE PLANNER
              </h2>
            </div>

            <div className="space-y-1 text-sm font-medium text-slate-700 pl-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rail-maroon" />
                <span><strong>{tasksNeedingScheduling}</strong> maintenance tasks require scheduling</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span><strong>{conflictsDetected}</strong> critical train/possession conflicts detected on Track C2</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>
                  <strong>{pendingReplansCount || 1}</strong> engineer delay request pending review
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              to="/manager/planner"
              className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rail-maroon hover:bg-rail-maroon-dark text-white rounded-lg font-bold text-sm transition-all shadow-sm tracking-wide"
            >
              <span>[ OPEN AUTO PLANNER ]</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Operational Decision Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Critical Maintenance Queue */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-rail-maroon" />
              <h3 className="font-bold text-sm text-slate-900">Critical Maintenance Queue</h3>
            </div>
            <Link to="/manager/planner" className="text-xs font-bold text-rail-maroon hover:underline">
              Plan All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {tasks.slice(0, 4).map((t: any, idx: number) => {
              const pLevel = t.priority_score >= 80 ? 'CRITICAL' : 'HIGH'
              return (
                <div key={t.task_id || idx} className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {t.reference_no || `WO-102${idx + 4}`}
                      </span>
                      <PriorityBadge level={pLevel} />
                      <span className="text-[11px] text-slate-500 font-mono">{t.department || 'Engineering'}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{t.description}</p>
                    <div className="text-[11px] text-slate-500">
                      <span>Location: Section C2 • Est. {t.estimated_duration || 45} mins</span>
                    </div>
                  </div>

                  <Link
                    to="/manager/planner"
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200"
                  >
                    Schedule
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section B: Pending Replans & Engineer Interruption Requests */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Pending Replans & Delay Requests</h3>
            </div>
            <Link to="/manager/replan" className="text-xs font-bold text-rail-maroon hover:underline">
              View Replan Center →
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {/* Engineer Interruption Card (Part 9, 10, 11) */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>WO-1024 • Engineer Arun Delay Request</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded uppercase">
                  +35 min delay
                </span>
              </div>
              <p className="text-xs text-slate-700">
                <strong>Reported Problem:</strong> Replacement rail component delayed from yard siding.
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-amber-200/80">
                <span>Affected Track: <strong>C2</strong> (14:30 → 15:15)</span>
                <Link
                  to="/manager/replan"
                  className="px-2.5 py-1 bg-rail-maroon text-white font-bold rounded text-xs hover:bg-rail-maroon-dark"
                >
                  Review AI Replan
                </Link>
              </div>
            </div>

            {/* Timetable Conflict Alert */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Track C2 Possession Conflict</span>
                <span className="text-[10px] font-mono text-red-700 bg-red-100 px-1.5 py-0.5 rounded font-bold">
                  Overlap 14:45–14:52
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Train 12675 scheduled through Track C2 during planned maintenance window.
              </p>
              <div className="pt-1 flex justify-end">
                <Link to="/manager/planner" className="text-xs font-bold text-rail-maroon hover:underline">
                  Resolve in Timeline →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Today's Blocks & Operational Timeline Link */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
            <Calendar className="w-5 h-5 text-rail-maroon" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Today's Corridor Possessions (Section C2)</h4>
            <p className="text-xs text-slate-500">
              Coordinated multi-department block authorized from 14:00 to 16:30.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/manager/timetable"
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors"
          >
            View Live Timetable
          </Link>
        </div>
      </div>
    </div>
  )
}
