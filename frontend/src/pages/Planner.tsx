import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  runOptimization,
  fetchCorridors,
  fetchStrategic26WeekProgram,
  fetchSectionOfficers,
  fetchPlanConcurrenceStatus,
  submitSectionOfficerConcurrence,
  grantPossessionByChiefController,
  computeCCIScore,
  computeDisruptionRisk
} from '../services/api'
import { SolverStatsCard } from '../components/planner/SolverStatsCard'
import { CorridorTimeSpaceDiagram } from '../components/timeline/CorridorTimeSpaceDiagram'
import {
  Play,
  Sliders,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Check,
  AlertTriangle,
  Activity,
  Maximize2,
  Table as TableIcon
} from 'lucide-react'

export const Planner: React.FC = () => {
  const navigate = useNavigate()
  const [corridors, setCorridors] = useState<any[]>([])
  const [selectedCorridor, setSelectedCorridor] = useState<number>(2)
  const [horizon, setHorizon] = useState<string>('DAILY')
  const [viewMode, setViewMode] = useState<'TIME_SPACE' | 'TABLE'>('TIME_SPACE')

  const [selectedDepts, setSelectedDepts] = useState<string[]>([
    'Engineering/Track',
    'S&T/Signalling',
    'Traction Distribution',
    'Telecommunication'
  ])

  const [wAsset, setWAsset] = useState<number>(30)
  const [wTrain, setWTrain] = useState<number>(25)
  const [wPriority, setWPriority] = useState<number>(20)
  const [wCoord, setWCoord] = useState<number>(15)
  const [wEfficiency, setWEfficiency] = useState<number>(10)
  const [includeLowPrio, setIncludeLowPrio] = useState<boolean>(true)
  const [maxSolveTime, setMaxSolveTime] = useState<number>(10)

  const [isSolving, setIsSolving] = useState<boolean>(false)
  const [solveElapsed, setSolveElapsed] = useState<number>(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Strategic 26-Week State
  const [strategicProgram, setStrategicProgram] = useState<any | null>(null)
  const [loadingStrategic, setLoadingStrategic] = useState<boolean>(false)

  // Concurrence State
  const [sectionOfficers, setSectionOfficers] = useState<any[]>([])
  const [concurrenceStatus, setConcurrenceStatus] = useState<any | null>(null)
  const [concurringOfficer, setConcurringOfficer] = useState<string | null>(null)

  // CCI / Disruption Modal State
  const [showCciModal, setShowCciModal] = useState<boolean>(false)
  const [cciResult, setCciResult] = useState<any | null>(null)
  const [disruptionResult, setDisruptionResult] = useState<any | null>(null)

  useEffect(() => {
    fetchCorridors().then((res) => {
      setCorridors(res || [])
      if (res && res.length > 0) setSelectedCorridor(res[0].corridor_id)
    }).catch(console.error)

    fetchSectionOfficers().then((res) => {
      setSectionOfficers(res || [])
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (horizon === '26-WEEK ROLLING') {
      setLoadingStrategic(true)
      fetchStrategic26WeekProgram(selectedCorridor)
        .then((res) => setStrategicProgram(res))
        .catch(console.error)
        .finally(() => setLoadingStrategic(false))
    }
  }, [horizon, selectedCorridor])

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
      if (selectedDepts.length > 1) setSelectedDepts(selectedDepts.filter((d) => d !== dept))
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

      // Initialize concurrence status
      const planId = res.plan_id || 101
      const cStatus = await fetchPlanConcurrenceStatus(planId)
      setConcurrenceStatus(cStatus)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Optimization failed to find feasible schedule')
    } finally {
      setIsSolving(false)
    }
  }

  const handleConcur = async (role: string, officerName: string) => {
    setConcurringOfficer(role)
    const planId = result?.plan_id || 101
    try {
      const res = await submitSectionOfficerConcurrence({
        plan_id: planId,
        officer_role: role,
        officer_name: officerName,
        decision: 'CONCURRED',
        comments: 'No departmental objection. Safety possessory clearance verified.'
      })
      setConcurrenceStatus(res.concurrence_status)
    } catch (err) {
      console.error('Concurrence failed:', err)
    } finally {
      setConcurringOfficer(null)
    }
  }

  const handleGrantPossession = async () => {
    const planId = result?.plan_id || 101
    try {
      const res = await grantPossessionByChiefController(planId)
      const cStatus = await fetchPlanConcurrenceStatus(planId)
      setConcurrenceStatus(cStatus)
    } catch (err) {
      console.error('Possession grant failed:', err)
    }
  }

  const handleCalculateCCI = async () => {
    try {
      const cci = await computeCCIScore({
        defect_severity: 9,
        defect_code: 'IMR',
        rams_rcm_risk: 0.88,
        days_overdue: 3,
        gmt_density: 68.5,
        safety_impact: 10
      })
      setCciResult(cci)

      const dis = await computeDisruptionRisk({
        severity: 9,
        cci_score: cci.composite_criticality_index,
        gmt_density: 68.5,
        days_overdue: 3,
        trains_per_hour: 6.5
      })
      setDisruptionResult(dis)
      setShowCciModal(true)
    } catch (err) {
      console.error('Failed to calculate CCI:', err)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Multi-Department Block Planning & Optimization Engine
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              CP-SAT MOMBSP
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Solves the Multi-Objective Maintenance Block Scheduling Problem with <strong>Spatial Shadowing Clustering</strong> and multi-horizon rolling calendars.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCalculateCCI}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Test CCI & Disruption ML</span>
          </button>

          <button
            onClick={handleGeneratePlan}
            disabled={isSolving}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Play className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? `Solving... (${solveElapsed}s)` : 'Run CP-SAT MOMBSP Solver'}</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Horizon & Corridors */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 shadow-md">
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Multi-Horizon Planning Configuration</span>
            </h3>

            {/* Horizon Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Planning Horizon</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'DAILY', label: 'DAILY (Tactical 24h)' },
                  { id: 'WEEKLY', label: 'WEEKLY (Micro-Tuned)' },
                  { id: 'MONTHLY', label: 'MONTHLY' },
                  { id: '26-WEEK ROLLING', label: '26-WEEK ROLLING (Mechanized)' }
                ].map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHorizon(h.id)}
                    className={`py-2 px-2 text-center text-[11px] font-mono rounded-lg border transition-all ${
                      horizon === h.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Corridor Picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Target Corridor</label>
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(Number(e.target.value))}
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-200 outline-none focus:border-blue-500"
              >
                {corridors.map((c) => (
                  <option key={c.corridor_id} value={c.corridor_id} className="bg-zinc-900">
                    {c.name} ({c.sections?.length || 4} sections)
                  </option>
                ))}
              </select>
            </div>

            {/* Participating Departments */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Joint Possessions</label>
              <div className="space-y-1.5">
                {[
                  'Engineering/Track',
                  'S&T/Signalling',
                  'Traction Distribution',
                  'Bridges / BDMS'
                ].map((dept) => {
                  const active = selectedDepts.includes(dept)
                  return (
                    <div
                      key={dept}
                      onClick={() => toggleDept(dept)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                        active
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <span>{dept}</span>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${active ? 'text-blue-400' : 'text-zinc-700'}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Multi-Objective Weights */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>MOMBSP Objective Weights</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                Sum: {wAsset + wTrain + wPriority + wCoord + wEfficiency}%
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { label: 'Maximize Asset Availability', value: wAsset, set: setWAsset, color: 'text-blue-400', accent: 'accent-blue-600' },
                { label: 'Minimize Train Disruption Cost', value: wTrain, set: setWTrain, color: 'text-amber-400', accent: 'accent-amber-500' },
                { label: 'High-Priority CCI Completion', value: wPriority, set: setWPriority, color: 'text-indigo-400', accent: 'accent-indigo-500' },
                { label: 'Cross-Department Shadowing Bonus', value: wCoord, set: setWCoord, color: 'text-purple-400', accent: 'accent-purple-500' },
                { label: 'Block Utilization Efficiency', value: wEfficiency, set: setWEfficiency, color: 'text-emerald-400', accent: 'accent-emerald-500' }
              ].map(({ label, value, set, color, accent }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>{label}</span>
                    <span className={color}>{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className={`w-full ${accent} cursor-pointer`}
                  />
                </div>
              ))}
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-zinc-500 font-mono">
              <strong className="text-zinc-400">Shadowing Guarantee:</strong> Automatically clubs co-located S&T, TRD, and Bridge defects into Track possession windows to minimize downtime.
            </div>
          </div>
        </div>

        {/* Right Column: Live Solver Diagnostics & Solution Summary */}
        <div className="space-y-4">
          <SolverStatsCard stats={result?.solver_stats} />

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs space-y-1 font-mono">
              <span className="font-medium flex items-center space-x-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Optimization Infeasible</span>
              </span>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-100 font-mono">Plan #{result.plan_id || 101} Scheduled</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Tasks Scheduled</span>
                  <span className="text-xl font-bold text-zinc-100">{result.assignments?.length || 0}</span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Shadowed Clusters</span>
                  <span className="text-xl font-bold text-purple-400">{result.shadow_clusters?.length || result.bundled_blocks?.length || 0}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 space-y-1">
                <div className="flex justify-between">
                  <span>Saved Infrastructure Downtime:</span>
                  <span className="text-emerald-400 font-bold">{result.metrics?.saved_downtime_hours || 2.5} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span>Train Delay Cost Saved:</span>
                  <span className="text-blue-400 font-bold">₹{(result.metrics?.delay_cost_saved_inr || 37500).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategic 26-Week Mechanized Fleet View */}
      {horizon === '26-WEEK ROLLING' && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Strategic Horizon: 26-Week Rolling Mechanized Maintenance Program</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Long-range machine possessions for Track Relaying Trains (TRT), Ballast Cleaners (BCM), Continuous Tamping (CSM), and OHE Wire Renewal.
              </p>
            </div>
            {strategicProgram && (
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
                Total Machine Hours: {strategicProgram.kpis?.total_machine_block_hours}h
              </span>
            )}
          </div>

          {loadingStrategic ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500">
              Generating 26-week rolling schedule...
            </div>
          ) : strategicProgram && (
            <div className="overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Week</th>
                    <th className="p-3">Machine & Type</th>
                    <th className="p-3">Program</th>
                    <th className="p-3">Section & Chainage</th>
                    <th className="p-3">Length</th>
                    <th className="p-3">Block Window</th>
                    <th className="p-3">Crew</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                  {strategicProgram.schedule.slice(0, 8).map((w: any) => (
                    <tr key={w.week_number} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3 font-bold text-blue-400">Week {w.week_number}</td>
                      <td className="p-3">
                        <span className="font-bold text-zinc-100">{w.machine_id}</span>
                        <span className="block text-[10px] text-zinc-500 truncate max-w-xs">{w.machine_type}</span>
                      </td>
                      <td className="p-3 text-zinc-300">{w.program_name}</td>
                      <td className="p-3">
                        <span className="text-purple-300 font-bold">{w.section_code}</span>
                        <span className="block text-[10px] text-amber-300">{w.chainage}</span>
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{w.length_km} km</td>
                      <td className="p-3 text-zinc-400">{w.block_hours}h night block</td>
                      <td className="p-3 text-zinc-300">{w.crew_required} members</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section Officers Digital Concurrence Card */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Multi-Department Section Officers Digital Concurrence Workflow</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Statutory sign-off required from <strong>Sr. DEN (Civil), Sr. DSTE (S&T), Sr. DEE (Electrical)</strong> before <strong>Chief Controller (CTPC)</strong> issues possession grant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {concurrenceStatus?.all_concurred && !concurrenceStatus?.possession_granted && (
              <button
                onClick={handleGrantPossession}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono shadow-md transition-all flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Issue Chief Controller Grant</span>
              </button>
            )}

            {concurrenceStatus?.possession_granted && (
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ POSSESSION OFFICIALLY GRANTED
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              role: 'SR_DEN',
              title: 'Senior Divisional Engineer',
              dept: 'Civil / Track & Bridges',
              name: 'Er. Arunachalam (Sr. DEN/North)',
              status: concurrenceStatus?.civil_den?.status || 'PENDING'
            },
            {
              role: 'SR_DSTE',
              title: 'Sr. Divisional Signal Engineer',
              dept: 'Signal & Telecom',
              name: 'Er. Meenakshi (Sr. DSTE)',
              status: concurrenceStatus?.signal_dste?.status || 'PENDING'
            },
            {
              role: 'SR_DEE',
              title: 'Sr. Divisional Electrical Engineer',
              dept: 'Traction Distribution (TRD)',
              name: 'Er. Venkatesh (Sr. DEE/TrD)',
              status: concurrenceStatus?.electrical_dee?.status || 'PENDING'
            },
            {
              role: 'CHIEF_CONTROLLER',
              title: 'Chief Train Planning Controller',
              dept: 'Operating / Control Board',
              name: 'Chief Controller Rajesh (CTPC)',
              status: concurrenceStatus?.possession_granted ? 'GRANTED' : (concurrenceStatus?.all_concurred ? 'READY_TO_GRANT' : 'AWAITING_CONCURRENCE')
            }
          ].map((officer) => {
            const isConcurred = officer.status === 'CONCURRED' || officer.status === 'GRANTED'
            return (
              <div
                key={officer.role}
                className={`p-3.5 rounded-xl border transition-all ${
                  isConcurred
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold">{officer.role}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isConcurred
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {officer.status}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-zinc-200 mt-2">{officer.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{officer.dept}</p>

                {officer.role !== 'CHIEF_CONTROLLER' && (
                  <button
                    onClick={() => handleConcur(officer.role, officer.name)}
                    disabled={isConcurred || concurringOfficer === officer.role}
                    className="mt-3 w-full py-1.5 rounded text-[11px] font-mono transition-colors border disabled:opacity-50"
                    style={{
                      background: isConcurred ? '#10b981' : '#27272a',
                      color: isConcurred ? '#ffffff' : '#e4e4e7',
                      borderColor: isConcurred ? '#059669' : '#3f3f46'
                    }}
                  >
                    {isConcurred ? '✓ Concurrence Recorded' : concurringOfficer === officer.role ? 'Signing...' : 'Submit Digital Concurrence'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Visual Corridor Time-Space Diagram (Marey Chart) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Interactive Corridor View: Train Trajectories vs Proposed & Granted Blocks</span>
          </h2>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('TIME_SPACE')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                viewMode === 'TIME_SPACE' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Time-Space Diagram</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                viewMode === 'TABLE' ? 'bg-blue-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Assignments Table</span>
            </button>
          </div>
        </div>

        {viewMode === 'TIME_SPACE' ? (
          <CorridorTimeSpaceDiagram corridorId={selectedCorridor} />
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
              <h3 className="font-semibold text-zinc-100 text-sm">Scheduled Maintenance Block Assignments</h3>
              <span className="text-xs font-mono text-blue-400">{result?.assignments?.length || 0} scheduled</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Task Ref</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Assigned Block</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/40 text-zinc-300">
                  {(result?.assignments || []).map((a: any) => (
                    <tr key={a.task_id} className="hover:bg-zinc-800/40">
                      <td className="p-3 font-bold text-blue-400">T-{a.task_id}</td>
                      <td className="p-3">{a.department}</td>
                      <td className="p-3 text-zinc-400 max-w-sm truncate">{a.task_description}</td>
                      <td className="p-3 text-purple-300 font-bold">Block #{a.block_id}</td>
                      <td className="p-3 text-zinc-400">{a.duration_minutes}m</td>
                      <td className="p-3 text-emerald-400 font-bold">OPTIMIZED</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CCI & Disruption Modal */}
      {showCciModal && cciResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-zinc-100">
                  Composite Criticality Index (CCI) & Deferral Disruption Analysis
                </h3>
              </div>
              <button
                onClick={() => setShowCciModal(false)}
                className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* CCI Score Gauge */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Composite Criticality Score</span>
                <span className="text-3xl font-black text-red-400 font-mono">
                  {cciResult.composite_criticality_index} <span className="text-sm font-normal text-zinc-500">/ 100</span>
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  {cciResult.urgency_level}
                </span>
              </div>
              <div className="text-right text-xs font-mono text-zinc-400 space-y-1">
                <div>Defect Severity: <span className="text-zinc-200 font-bold">{cciResult.breakdown.defect_severity_score}/30</span></div>
                <div>RAMS/RCM Risk: <span className="text-zinc-200 font-bold">{cciResult.breakdown.rams_rcm_risk_score}/25</span></div>
                <div>Overdue Factor: <span className="text-zinc-200 font-bold">{cciResult.breakdown.overdue_penalty_score}/25</span></div>
                <div>Line GMT Density: <span className="text-zinc-200 font-bold">{cciResult.breakdown.gmt_traffic_density_score}/20</span></div>
              </div>
            </div>

            {/* Predictive Disruption Scenarios */}
            {disruptionResult && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">
                  Disruption Risk if Possession Block Window Deferred:
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[24, 48, 168].map((h) => {
                    const sc = disruptionResult.deferral_scenarios[`defer_${h}h`]
                    return (
                      <div key={h} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs font-mono space-y-1">
                        <span className="text-[10px] text-zinc-500 block uppercase">Defer {h <= 48 ? `${h} Hours` : '7 Days'}</span>
                        <div className="text-base font-bold text-amber-400">
                          {Math.round(sc.disruption_probability * 100)}% Prob.
                        </div>
                        <span className="text-[10px] text-zinc-400 block">
                          Delay: ~{sc.expected_train_delay_minutes} mins
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCciModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors font-mono"
            >
              Acknowledge & Return to Planning
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Planner
