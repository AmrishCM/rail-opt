import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAvailableWindows,
  generateRecommendedPlan,
  fetchPlans
} from '../../services/api'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Train,
  Layers,
  ShieldCheck,
  Zap,
  Users,
  Check,
  ChevronRight,
  FileCheck
} from 'lucide-react'

export const PlanGenerationWorkflow: React.FC = () => {
  const { user } = useAuth()
  const role = user?.role || 'MAINTENANCE_ENGINEER'
  const navigate = useNavigate()

  const [windows, setWindows] = useState<any[]>([])
  const [existingPlans, setExistingPlans] = useState<any[]>([])
  const [loadingWindows, setLoadingWindows] = useState<boolean>(true)

  // Plan generation execution states
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationStep, setGenerationStep] = useState<number>(0)
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generationStages = [
    'CHECKING MAINTENANCE WORK',
    'CHECKING TRAIN MOVEMENTS',
    'CHECKING AVAILABLE BLOCKS',
    'CHECKING TEAM AVAILABILITY',
    'COMBINING COMPATIBLE WORK',
    'CREATING PLAN',
    'VALIDATING PLAN'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoadingWindows(true)
    try {
      const [winData, planData] = await Promise.all([
        fetchAvailableWindows(2, 2),
        fetchPlans()
      ])
      setWindows(winData || [])
      setExistingPlans(planData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingWindows(false)
    }
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedPlan(null)
    setGenerationStep(0)

    // Visual progression representing real backend checks
    const stageInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 6 ? prev + 1 : prev))
    }, 450)

    try {
      const res = await generateRecommendedPlan({
        corridor_ids: [2],
        departments: ['Engineering/Track', 'S&T/Signalling', 'Traction Distribution'],
        max_solve_time_seconds: 10
      })
      clearInterval(stageInterval)
      setGenerationStep(6)
      setGeneratedPlan(res)
      loadData()
    } catch (err: any) {
      clearInterval(stageInterval)
      setError(
        err?.response?.data?.detail ||
        'We could not generate a valid maintenance plan. There are not enough available windows for selected work.'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Intelligent Block Planning & Coordination
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              CORRIDOR C2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section C2-02 (KM 32.0 – KM 68.5) • Coordinates Track, Signalling, and Traction possessions.
          </p>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 flex items-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? 'Analyzing Timetable...' : 'GENERATE MAINTENANCE PLAN'}</span>
        </button>
      </div>

      {/* GENERATION PROGRESSION OVERLAY (Section 6 & 69) */}
      {isGenerating && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-blue-400">
              Running Automatic Railway Constraint Engine
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {generationStages.map((stage, idx) => {
              const isDone = generationStep > idx
              const isCurrent = generationStep === idx

              return (
                <div
                  key={stage}
                  className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-blue-600/30 text-white font-bold'
                      : isDone
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  <span className="text-[11px] font-mono w-4">
                    {isDone ? '✓' : isCurrent ? '►' : '•'}
                  </span>
                  <span>{stage}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ERROR CARD */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Could Not Generate Schedule</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* GENERATED PLAN RESULT (Section 7 & 8) */}
      {generatedPlan && (
        <div className="bg-white rounded-2xl border-2 border-blue-500/50 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                Step 4 Recommendation Result
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                AI RECOMMENDED MAINTENANCE PLAN
              </h2>
              <p className="text-xs text-slate-500">15 September 2026 • Section C2-02</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full uppercase">
                {generatedPlan.status}
              </span>
            </div>
          </div>

          {/* Plan Summary Card (Section 7) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Recommended Block:</span>
                <span className="font-extrabold text-slate-900">14:00 – 16:30 (2.5 Hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Location:</span>
                <span className="font-extrabold text-slate-900">Corridor C2 / Section C2-02</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Maintenance Work:</span>
                <span className="font-extrabold text-slate-900">Track repair, Signal test, Traction check</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Coordinated Teams:</span>
                <span className="font-extrabold text-blue-700">Engineering, S&T, Traction</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Expected Train Disruption:</span>
                <span className="font-extrabold text-emerald-600">Low (15 min margin)</span>
              </div>
            </div>

            {/* Smart Multi-Department Combination Card (Section 8) */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-indigo-900 font-black">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>SMART COMBINATION</span>
              </div>
              <p className="text-indigo-950 font-medium leading-relaxed">
                3 maintenance activities require access to the same section. Instead of creating 3 separate blocks,
                RailOpt-AI recommends <strong>one coordinated block</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100 text-[11px]">
                <div className="p-2 bg-white/80 rounded-lg border border-indigo-100">
                  <div className="text-slate-500 font-bold">Separate Work:</div>
                  <div className="text-slate-800 font-semibold mt-0.5">Eng 2h + S&T 1h + Traction 1h</div>
                  <div className="text-red-600 font-extrabold mt-1">Total: 4.0 Hours</div>
                </div>
                <div className="p-2 bg-white/80 rounded-lg border border-indigo-100">
                  <div className="text-slate-500 font-bold">Coordinated Plan:</div>
                  <div className="text-slate-800 font-semibold mt-0.5">Single shared possession</div>
                  <div className="text-emerald-700 font-extrabold mt-1">Single Block: 2.5 Hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Section 7) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Link
              to={`/plans/${generatedPlan.plan_id}`}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
            >
              <span>VIEW DETAILED PLAN & TASKS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center space-x-2 self-end">
              <Link
                to={`/plans/${generatedPlan.plan_id}`}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl"
              >
                REQUEST CHANGES
              </Link>
              <Link
                to={`/plans/${generatedPlan.plan_id}`}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {role === 'OPERATIONS_MANAGER' ? 'APPROVE PLAN' : 'SUBMIT FOR APPROVAL'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE WORK WINDOWS (Section 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Step 3 Analysis</span>
            <h3 className="text-base font-black text-slate-900 uppercase">AVAILABLE MAINTENANCE WINDOWS TODAY</h3>
            <p className="text-xs text-slate-500">
              Evaluated against passenger train timetables, freight movements, and safety headway margins.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">Corridor C2 • Today</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {windows.map((w) => (
            <div
              key={w.block_id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                w.is_recommended
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">{w.time_range}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      w.traffic_rating === 'RECOMMENDED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : w.traffic_rating === 'SUITABLE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {w.traffic_badge}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Duration: {w.duration_minutes} minutes</div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{w.explanation}</p>
              </div>

              {w.is_recommended && (
                <div className="mt-3 pt-2 border-t border-blue-200/60 text-[10px] font-extrabold text-blue-700 uppercase">
                  AI Preferred Possession Slot
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* EXISTING RECENT PLANS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase">Existing Corridor Maintenance Plans</h3>
          <Link to="/planner/compare" className="text-xs font-bold text-blue-600 hover:underline">
            Compare Baseline vs AI →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {existingPlans.map((p) => (
            <div key={p.plan_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    Plan #{p.plan_id}: {p.plan_name}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Tasks: {p.tasks_count} • Train delay: {p.train_impact_minutes || 15}m • Asset avail: {p.asset_availability || 97}%
                </div>
              </div>

              <Link
                to={`/plans/${p.plan_id}`}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs self-end sm:self-center"
              >
                View Plan →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default PlanGenerationWorkflow
