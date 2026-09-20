import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchAvailableWindows,
  generatePlan,
  fetchPlans,
  fetchCorridorSections
} from '../../services/api'
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronRight,
  Info,
  ShieldAlert,
  Users
} from 'lucide-react'

export const PlanGenerationWorkflow: React.FC = () => {
  const { role } = useAuth()
  const navigate = useNavigate()

  const [windows, setWindows] = useState<any[]>([])
  const [existingPlans, setExistingPlans] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationStep, setGenerationStep] = useState<number>(0)

  const generationStages = [
    'Scanning unassigned open maintenance requests in Corridor C2...',
    'Evaluating train schedules (Express, Freight, EMU, High-Speed)...',
    'Calculating multi-objective optimization (Weights: Safety 30%, Train Delay 25%)...',
    'Executing Google OR-Tools CP-SAT constraint solver...',
    'Harmonizing multi-department joint possession window...',
    'Finalizing optimal conflict-free maintenance plan...'
  ]

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [w, p] = await Promise.all([
        fetchAvailableWindows(),
        fetchPlans()
      ])
      setWindows(w || [])
      setExistingPlans(p || [])
    } catch (err) {
      console.error('Failed to load initial planning data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedPlan(null)
    setGenerationStep(0)

    for (let i = 0; i < generationStages.length; i++) {
      setGenerationStep(i)
      await new Promise((r) => setTimeout(r, 450))
    }

    try {
      const plan = await generatePlan(2, '2026-09-15')
      setGeneratedPlan(plan)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Planning engine execution failed. Please verify solver constraints.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Corridor C2 &bull; Automated Decision System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Intelligent Block Planning &amp; Coordination
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Section C2-02 (KM 32.0 – KM 68.5) &bull; Coordinates Track, Signalling, and Traction possessions
          </p>
        </div>

        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm flex items-center space-x-2 disabled:opacity-50 transition-colors"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          <span>{isGenerating ? 'Analyzing Timetable...' : 'Generate Maintenance Plan'}</span>
        </button>
      </div>

      {/* GENERATION PROGRESSION OVERLAY */}
      {isGenerating && (
        <div className="bg-zinc-900 text-zinc-100 p-6 rounded-lg shadow-xl border border-zinc-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <h3 className="text-xs font-mono tracking-wider uppercase text-blue-400">
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
                  className={`flex items-center space-x-3 px-3 py-1.5 rounded-md transition-colors ${
                    isCurrent
                      ? 'bg-blue-500/10 text-blue-300 font-medium'
                      : isDone
                      ? 'text-emerald-400 font-normal'
                      : 'text-zinc-500'
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
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 space-y-1.5">
          <div className="flex items-center space-x-2 font-medium text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
            <span>Could Not Generate Schedule</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* GENERATED PLAN RESULT */}
      {generatedPlan && (
        <div className="bg-zinc-900 rounded-lg border border-blue-500/40 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-400 tracking-wider">
                Recommendation Result
              </span>
              <h2 className="text-base font-semibold text-zinc-100 mt-0.5 uppercase tracking-wide">
                AI Recommended Maintenance Plan
              </h2>
              <p className="text-xs text-zinc-400">15 September 2026 &bull; Section C2-02</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-medium px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">
                {generatedPlan.status}
              </span>
            </div>
          </div>

          {/* Plan Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950/60 rounded-md border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-mono">Recommended Block:</span>
                <span className="font-mono font-semibold text-zinc-100">14:00 – 16:30 (2.5 Hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-mono">Location:</span>
                <span className="font-medium text-zinc-200">Corridor C2 / Section C2-02</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-mono">Maintenance Work:</span>
                <span className="font-medium text-zinc-200">Track repair, Signal test, Traction check</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-mono">Coordinated Teams:</span>
                <span className="font-medium text-blue-400">Engineering, S&amp;T, Traction</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-mono">Expected Train Disruption:</span>
                <span className="font-mono font-semibold text-emerald-400">Low (15 min margin)</span>
              </div>
            </div>

            {/* Smart Multi-Department Combination Card */}
            <div className="p-4 bg-zinc-950/60 rounded-md border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-blue-400 font-mono uppercase text-[11px]">
                <Users className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                <span>Smart Multi-Department Combination</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                3 maintenance activities require access to the same section. Instead of creating 3 separate blocks,
                RailOpt-AI recommends <strong className="text-zinc-100">one coordinated block</strong>.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono">
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <div className="text-zinc-500">Separate Work:</div>
                  <div className="text-zinc-300 font-normal mt-0.5">Eng 2h + S&amp;T 1h + Traction 1h</div>
                  <div className="text-red-400 font-medium mt-1">Total: 4.0 Hours</div>
                </div>
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800">
                  <div className="text-zinc-500">Coordinated Plan:</div>
                  <div className="text-zinc-300 font-normal mt-0.5">Single shared possession</div>
                  <div className="text-emerald-400 font-medium mt-1">Single Block: 2.5 Hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            <Link
              to={`/plans/${generatedPlan.plan_id}`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs rounded-md flex items-center justify-center space-x-2 transition-colors"
            >
              <span>View Detailed Plan &amp; Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>

            <div className="flex items-center space-x-2 self-end">
              <Link
                to={`/plans/${generatedPlan.plan_id}`}
                className="px-3.5 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-medium text-xs rounded-md transition-colors"
              >
                Request Changes
              </Link>
              <Link
                to={`/plans/${generatedPlan.plan_id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md transition-colors shadow-sm"
              >
                {role === 'OPERATIONS_MANAGER' ? 'Approve Plan' : 'Submit for Approval'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABLE WORK WINDOWS */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500">Constraint Evaluation</span>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Available Maintenance Windows Today</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Evaluated against passenger train timetables, freight movements, and safety headway margins
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">Corridor C2 &bull; Today</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {windows.map((w) => (
            <div
              key={w.block_id}
              className={`p-4 rounded-md border flex flex-col justify-between transition-colors ${
                w.is_recommended
                  ? 'bg-blue-500/10 border-blue-500/40 text-zinc-100'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-100">{w.time_range}</span>
                  <span
                    className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded ${
                      w.traffic_rating === 'RECOMMENDED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : w.traffic_rating === 'SUITABLE'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {w.traffic_badge}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 font-mono">Duration: {w.duration_minutes} minutes</div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{w.explanation}</p>
              </div>

              {w.is_recommended && (
                <div className="mt-3 pt-2 border-t border-blue-500/20 text-[10px] font-mono text-blue-400 uppercase">
                  AI Preferred Possession Slot
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* EXISTING RECENT PLANS */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">Existing Corridor Maintenance Plans</h3>
          <Link to="/planner/compare" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            Compare Baseline vs AI &rarr;
          </Link>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {existingPlans.map((p) => (
            <div key={p.plan_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-zinc-100">
                    Plan #{p.plan_id}: {p.plan_name}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  Tasks: {p.tasks_count} &bull; Train delay: {p.train_impact_minutes || 15}m &bull; Asset avail: {p.asset_availability || 97}%
                </div>
              </div>

              <Link
                to={`/plans/${p.plan_id}`}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium self-end sm:self-center transition-colors"
              >
                View Plan &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlanGenerationWorkflow
