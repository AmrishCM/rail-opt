import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { runOptimization, fetchCorridors } from '../services/api'
import { SolverStatsCard } from '../components/planner/SolverStatsCard'
import {
  Cpu,
  Play,
  Sliders,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'

export const Planner: React.FC = () => {
  const navigate = useNavigate()
  const [corridors, setCorridors] = useState<any[]>([])
  const [selectedCorridor, setSelectedCorridor] = useState<number>(1)
  const [horizon, setHorizon] = useState<string>('DAILY')
  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'Engineering/Track',
    'S&T/Signalling',
    'Traction Distribution',
    'Telecommunication'
  ])

  // Configurable Multi-Objective Weights
  const [wAsset, setWAsset] = useState<number>(30)
  const [wTrain, setWTrain] = useState<number>(25)
  const [wPriority, setWPriority] = useState<number>(20)
  const [wCoord, setWCoord] = useState<number>(15)
  const [wEfficiency, setWEfficiency] = useState<number>(10)

  const [includeLowPrio, setIncludeLowPrio] = useState<boolean>(true)
  const [maxSolveTime, setMaxSolveTime] = useState<number>(10)

  // Execution states
  const [isSolving, setIsSolving] = useState<boolean>(false)
  const [solveElapsed, setSolveElapsed] = useState<number>(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCorridors().then((res) => {
      setCorridors(res || [])
      if (res && res.length > 0) {
        setSelectedCorridor(res[0].corridor_id)
      }
    }).catch(console.error)
  }, [])

  // Timer while solving
  useEffect(() => {
    let timer: any
    if (isSolving) {
      setSolveElapsed(0)
      timer = setInterval(() => {
        setSolveElapsed((prev) => +(prev + 0.1).toFixed(1))
      }, 100)
    }
    return () => clearInterval(timer)
  }, [isSolving])

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== dept))
      }
    } else {
      setSelectedDepts([...selectedDepts, dept])
    }
  }

  const handleGeneratePlan = async () => {
    setIsSolving(true)
    setError(null)
    setResult(null)

    try {
      const payload = {
        corridor_ids: [selectedCorridor],
        departments: selectedDepts,
        objective_weights: {
          weight_asset_availability: wAsset / 100.0,
          weight_train_impact: wTrain / 100.0,
          weight_maintenance_priority: wPriority / 100.0,
          weight_coordination: wCoord / 100.0,
          weight_block_efficiency: wEfficiency / 100.0
        },
        include_low_priority: includeLowPrio,
        max_solve_time_seconds: maxSolveTime
      }

      const res = await runOptimization(payload)
      setResult(res)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Optimization failed to find feasible schedule')
    } finally {
      setIsSolving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Optimization Engine Control Room
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              OR-TOOLS CP-SAT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-objective operational weights, corridor constraints, and generate optimal block possession plans.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGeneratePlan}
            disabled={isSolving}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-extrabold shadow-sm transition-all ${
              isSolving
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-98'
            }`}
          >
            <Play className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? `SOLVING... (${solveElapsed}s)` : 'GENERATE OPTIMAL PLAN'}</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: Config Inputs & Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Planning Parameters */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Planning Horizon & Corridor</span>
            </h3>

            {/* Horizon Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Horizon</label>
              <div className="grid grid-cols-3 gap-2">
                {['DAILY', 'WEEKLY', 'MONTHLY'].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      horizon === h
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Corridor Picker */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Target Corridor</label>
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(Number(e.target.value))}
                className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                {corridors.map((c) => (
                  <option key={c.corridor_id} value={c.corridor_id}>
                    {c.name} ({c.sections?.length || 4} sections)
                  </option>
                ))}
              </select>
            </div>

            {/* Eligible Departments */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Coordinated Departments</label>
              <div className="space-y-1.5">
                {[
                  'Engineering/Track',
                  'S&T/Signalling',
                  'Traction Distribution',
                  'Telecommunication'
                ].map((dept) => {
                  const active = selectedDepts.includes(dept)
                  return (
                    <div
                      key={dept}
                      onClick={() => toggleDept(dept)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <span>{dept}</span>
                      <CheckCircle2 className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Threshold toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-700">Include Low-Priority Backlog</span>
              <input
                type="checkbox"
                checked={includeLowPrio}
                onChange={(e) => setIncludeLowPrio(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Center Column: Multi-Objective Configurable Weights */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                <span>Objective Function Weights</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Sum: {wAsset + wTrain + wPriority + wCoord + wEfficiency}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Configure priority tradeoffs for Google OR-Tools multi-objective scheduling.
            </p>

            <div className="space-y-4 pt-1">
              {/* Asset Availability Weight */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Maximize Asset Availability</span>
                  <span className="text-blue-600">{wAsset}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={wAsset}
                  onChange={(e) => setWAsset(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Train Disruption Minimization */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Minimize Train Disruption</span>
                  <span className="text-amber-600">{wTrain}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={wTrain}
                  onChange={(e) => setWTrain(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              {/* Maintenance Criticality */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>High-Priority Task Completion</span>
                  <span className="text-indigo-600">{wPriority}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={wPriority}
                  onChange={(e) => setWPriority(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Cross-Department Coordination */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Cross-Department Bundling</span>
                  <span className="text-purple-600">{wCoord}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={wCoord}
                  onChange={(e) => setWCoord(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Block Efficiency */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Block Utilization Efficiency</span>
                  <span className="text-emerald-600">{wEfficiency}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={wEfficiency}
                  onChange={(e) => setWEfficiency(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 leading-relaxed">
              <strong>Mathematical Guarantee:</strong> Weights directly scale the objective coefficients inside CP-SAT solver integer formulation.
            </div>
          </div>
        </div>

        {/* Right Column: Live Solver Diagnostics & Progress */}
        <div className="space-y-4">
          <SolverStatsCard stats={result?.solver_stats} />

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Optimization Infeasible</span>
              </span>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 space-y-4 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Plan #{result.plan_id} Ready</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Tasks</span>
                  <span className="text-xl font-extrabold text-slate-900">{result.assignments?.length || 0}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Bundled Blocks</span>
                  <span className="text-xl font-extrabold text-purple-700">{result.bundled_blocks?.length || 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => navigate('/simulation')}
                  className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs text-center transition-all"
                >
                  Simulate & Compare Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignments Table if Generated */}
      {result && result.assignments && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Generated Maintenance Block Assignments</h3>
              <p className="text-xs text-slate-500">Scheduled by Google OR-Tools CP-SAT without train conflicts</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {result.assignments.length} Tasks Scheduled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Assigned Block</th>
                  <th className="py-3 px-4">Safety Impact</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.assignments.slice(0, 10).map((a: any) => (
                  <tr key={a.task_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-extrabold text-slate-900">T-{a.task_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{a.department}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{a.task_description}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">Block #{a.block_id}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {a.safety_impact}/10
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{a.duration_minutes} min</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OPTIMIZED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Planner
