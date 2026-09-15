import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCorridors,
  fetchTasks,
  fetchBlockWindows,
  fetchPlans,
  fetchAnalyticsOverview
} from '../services/api'
import { CorridorTimeline } from '../components/corridor/CorridorTimeline'
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Calendar,
  CheckCircle2
} from 'lucide-react'

export const Dashboard: React.FC = () => {
  const [corridors, setCorridors] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [corrsRes, tasksRes, blocksRes, plansRes, anRes] = await Promise.all([
          fetchCorridors(),
          fetchTasks({ page_size: 15 }),
          fetchBlockWindows(),
          fetchPlans(),
          fetchAnalyticsOverview()
        ])
        setCorridors(corrsRes || [])
        setTasks(tasksRes?.items || [])
        setBlocks(blocksRes || [])
        setPlans(plansRes || [])
        setAnalytics(anRes)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const kpis = analytics?.kpi_summary || {
    asset_availability: 96.4,
    train_impact_minutes: 38,
    total_backlog: 50,
    critical_backlog: 5,
    high_safety_hazards: 7,
    ai_plan_score: 91.5
  }

  const criticalTasks = tasks.filter((t: any) => t.priority_score >= 80 || t.safety_impact >= 8)

  return (
    <div className="p-6 space-y-6">
      {/* Clean Operational Hero (Part 27 & Part 28) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Title, Description, Actions */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rail-maroon font-mono">
                RAILWAY OPERATIONS CONTROL
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Maintenance Planning and Timetable Coordination
              </h1>
            </div>

            <p className="text-sm text-slate-600 max-w-xl">
              Monitor reported issues, review AI-generated maintenance plans, coordinate engineering work, and manage operational blocks.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/manager/timetable"
                className="px-5 py-2.5 bg-rail-maroon hover:bg-rail-maroon-dark text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                [ VIEW TIMETABLE ]
              </Link>
              <Link
                to="/manager/approval-planning"
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition-colors"
              >
                [ OPEN PENDING APPROVALS ]
              </Link>
            </div>
          </div>

          {/* Right Column: Restrained Operational Visualization */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
              Corridor Possession Preview
            </div>

            {/* Track C1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">C1</span>
                <span>Track 1 (Up Line)</span>
              </div>
              <div className="relative h-6 bg-slate-200 rounded overflow-hidden">
                <div className="absolute left-[15%] w-[35%] h-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded">
                  TRAIN 12674
                </div>
                <div className="absolute left-[60%] w-[30%] h-full bg-rail-maroon text-white text-[10px] font-bold flex items-center justify-center rounded">
                  REPAIR WO-1024
                </div>
              </div>
            </div>

            {/* Track C2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">C2</span>
                <span>Track 2 (Down Line)</span>
              </div>
              <div className="relative h-6 bg-slate-200 rounded overflow-hidden">
                <div className="absolute left-[10%] w-[25%] h-full bg-rail-maroon text-white text-[10px] font-bold flex items-center justify-center rounded">
                  REPAIR WO-1025
                </div>
                <div className="absolute left-[45%] w-[45%] h-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded">
                  TRAIN 12675
                </div>
              </div>
            </div>

            {/* Track C3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">C3</span>
                <span>Loop Line</span>
              </div>
              <div className="relative h-6 bg-slate-200 rounded overflow-hidden">
                <div className="absolute left-[5%] w-[30%] h-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded">
                  TRAIN 06012
                </div>
                <div className="absolute left-[40%] w-[25%] h-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center rounded">
                  INSPECTION
                </div>
                <div className="absolute left-[70%] w-[25%] h-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded">
                  TRAIN 12676
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asset Availability */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Asset Availability</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.asset_availability}%</span>
            <span className="text-xs font-bold text-emerald-600">+5.2% vs baseline</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Operational track capacity</p>
        </div>

        {/* Maintenance Backlog */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Backlog</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.total_backlog}</span>
            <span className="text-xs font-semibold text-slate-500">tasks across 4 depts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Track • S&T • TRD • Telecom</p>
        </div>

        {/* Critical Safety Defects */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600">{kpis.critical_backlog}</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">High Risk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Priority score &gt; 80 (Safety hazards)</p>
        </div>

        {/* Train Disruption Reduction */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Train Disruption</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis.train_impact_minutes}m</span>
            <span className="text-xs font-bold text-emerald-600">-47% reduction</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Simulated timetable delay minutes</p>
        </div>
      </div>

      {/* Main Visual Element: Railway Corridor Timeline */}
      <CorridorTimeline
        corridorName={corridors[0]?.name || 'Northern Trunk Corridor (NDLS - CNB)'}
        sections={corridors[0]?.sections || []}
        blocks={blocks}
      />

      {/* Two Column Section: Active Backlog & Bundling Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: High Criticality Maintenance Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Prioritized Critical Tasks</h3>
              <p className="text-xs text-slate-500">Scored via ML Criticality & Failure Prediction Engine</p>
            </div>
            <Link to="/maintenance" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {criticalTasks.slice(0, 4).map((t: any) => (
              <div key={t.task_id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">T-{t.task_id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {t.department}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      Safety: {t.safety_impact}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{t.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-extrabold text-amber-600 block">
                    {t.priority_score}/100
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Criticality</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Multi-Department Coordination Savings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Multi-Department Block Bundling</h3>
              <p className="text-xs text-slate-500">Simultaneous possession execution (Track + S&T + TRD)</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Computed Savings
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-[10px] text-purple-700 font-bold uppercase block">Block Hours Saved</span>
              <span className="text-2xl font-black text-purple-900 mt-1 block">5.3 hrs</span>
              <span className="text-[11px] text-purple-600 font-medium">vs separate line blocks</span>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Train Delay Avoided</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">68 mins</span>
              <span className="text-[11px] text-blue-600 font-medium">timetable disruption spared</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">How Bundling Works:</span>
            <p className="leading-relaxed">
              When track maintenance requires a 120-minute possession on Section C1-S2, RailOpt-AI identifies compatible
              S&T signal testing and TRD catenary inspections and combines them into one 140-minute window instead of
              3 separate possessions totaling 270 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard