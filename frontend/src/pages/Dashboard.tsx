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
  ShieldCheck,
  Zap,
  ArrowRight
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
                RAILWAY OPERATIONS CONTROL
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight mt-1">
                Maintenance Planning and Timetable Coordination
              </h1>
            </div>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
              Monitor reported issues, review AI-generated maintenance plans, coordinate engineering work, and manage operational blocks.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/manager/timetable"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-xs transition-colors"
              >
                View Timetable
              </Link>
              <Link
                to="/manager/approval-planning"
                className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 rounded font-medium text-xs transition-colors"
              >
                Open Pending Approvals
              </Link>
            </div>
          </div>

          {/* Right Column: Corridor Possession Preview */}
          <div className="lg:col-span-5 bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] uppercase font-medium text-zinc-500 tracking-wider mb-2">
              Corridor Possession Preview
            </div>

            {/* Track C1 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-medium text-zinc-200">C1</span>
                <span>Track 1 (Up Line)</span>
              </div>
              <div className="relative h-6 bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <div className="absolute left-[15%] w-[35%] h-full bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center justify-center rounded">
                  TRAIN 12674
                </div>
                <div className="absolute left-[60%] w-[30%] h-full bg-blue-600/80 text-white text-[10px] font-mono flex items-center justify-center rounded">
                  REPAIR WO-1024
                </div>
              </div>
            </div>

            {/* Track C2 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-medium text-zinc-200">C2</span>
                <span>Track 2 (Down Line)</span>
              </div>
              <div className="relative h-6 bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <div className="absolute left-[10%] w-[25%] h-full bg-blue-600/80 text-white text-[10px] font-mono flex items-center justify-center rounded">
                  REPAIR WO-1025
                </div>
                <div className="absolute left-[45%] w-[45%] h-full bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center justify-center rounded">
                  TRAIN 12675
                </div>
              </div>
            </div>

            {/* Track C3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="font-medium text-zinc-200">C3</span>
                <span>Loop Line</span>
              </div>
              <div className="relative h-6 bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <div className="absolute left-[5%] w-[30%] h-full bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center justify-center rounded">
                  TRAIN 06012
                </div>
                <div className="absolute left-[40%] w-[25%] h-full bg-amber-600/80 text-white text-[10px] font-mono flex items-center justify-center rounded">
                  INSPECTION
                </div>
                <div className="absolute left-[70%] w-[25%] h-full bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center justify-center rounded">
                  TRAIN 12676
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Asset Availability</span>
            <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-semibold text-zinc-100">{kpis.asset_availability}%</span>
            <span className="text-xs font-mono text-emerald-400">+5.2% vs baseline</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Operational track capacity</p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Pending Backlog</span>
            <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-semibold text-zinc-100">{kpis.total_backlog}</span>
            <span className="text-xs font-mono text-zinc-500">tasks across 4 depts</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Track • S&T • TRD • Telecom</p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Critical Tasks</span>
            <div className="w-8 h-8 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-semibold text-rose-400">{kpis.critical_backlog}</span>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">High Risk</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Priority score &gt; 80 (Safety hazards)</p>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Train Disruption</span>
            <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono font-semibold text-zinc-100">{kpis.train_impact_minutes}m</span>
            <span className="text-xs font-mono text-emerald-400">-47% reduction</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Simulated timetable delay minutes</p>
        </div>
      </div>

      {/* Railway Corridor Timeline */}
      <CorridorTimeline
        corridorName={corridors[0]?.name || 'Northern Trunk Corridor (NDLS - CNB)'}
        sections={corridors[0]?.sections || []}
        blocks={blocks}
      />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: High Criticality Tasks */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-100 text-sm">Prioritized Critical Tasks</h3>
              <p className="text-xs text-zinc-500">Scored via ML Criticality & Failure Prediction Engine</p>
            </div>
            <Link to="/maintenance" className="text-xs font-mono text-blue-400 hover:underline flex items-center space-x-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800">
            {criticalTasks.slice(0, 4).map((t: any) => (
              <div key={t.task_id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-zinc-200">T-{t.task_id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {t.department}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Safety: {t.safety_impact}/10
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{t.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono text-amber-400 block">{t.priority_score}/100</span>
                  <span className="text-[10px] text-zinc-600 font-mono">Criticality</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Multi-Department Bundling Savings */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="font-medium text-zinc-100 text-sm">Multi-Department Block Bundling</h3>
              <p className="text-xs text-zinc-500">Simultaneous possession execution (Track + S&T + TRD)</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
              Computed Savings
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
              <span className="text-[10px] text-purple-400 font-mono uppercase block">Block Hours Saved</span>
              <span className="text-2xl font-mono font-semibold text-purple-300 mt-1 block">5.3 hrs</span>
              <span className="text-[11px] text-purple-400/70 font-mono">vs separate line blocks</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
              <span className="text-[10px] text-blue-400 font-mono uppercase block">Train Delay Avoided</span>
              <span className="text-2xl font-mono font-semibold text-blue-300 mt-1 block">68 mins</span>
              <span className="text-[11px] text-blue-400/70 font-mono">timetable disruption spared</span>
            </div>
          </div>

          <div className="p-3 rounded bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <span className="font-mono text-zinc-200 block">How bundling works:</span>
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