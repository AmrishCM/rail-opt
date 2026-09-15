import React, { useState, useEffect } from 'react'
import { runSimulation, fetchPlans } from '../services/api'
import { PlanComparisonTable } from '../components/planner/PlanComparisonTable'
import {
  PlayCircle,
  Clock,
  Zap,
  Activity,
  ShieldCheck,
  RotateCcw,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react'

export const Simulation: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1)
  const [seed, setSeed] = useState<number>(42)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans().then((res) => {
      setPlans(res || [])
      if (res && res.length > 0) {
        setSelectedPlanId(res[0].plan_id)
      }
    }).catch(console.error)
  }, [])

  const handleRunSimulation = async () => {
    setIsSimulating(true)
    setError(null)
    try {
      const res = await runSimulation({
        plan_id: selectedPlanId,
        random_seed: seed,
        run_baseline_comparison: true
      })
      setSimResult(res)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Simulation execution failed.')
    } finally {
      setIsSimulating(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Deterministic Discrete-Event Simulator
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              REPRODUCIBLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Validates railway schedule performance by simulating trains, block possessions, delays, and asset downtime minute-by-minute.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-500 font-semibold">Random Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 font-mono font-bold text-xs outline-hidden"
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-sm transition-all"
          >
            <PlayCircle className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'SIMULATING...' : 'RUN SIMULATION & EVALUATE'}</span>
          </button>
        </div>
      </div>

      {/* Target Plan Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-slate-700">Select Plan to Simulate:</span>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 outline-hidden"
          >
            {plans.map((p) => (
              <option key={p.plan_id} value={p.plan_id}>
                Plan #{p.plan_id} - {p.plan_name} ({p.assignments?.length || 0} tasks)
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 font-medium">Independent evaluator isolated from optimizer</span>
      </div>

      {/* BEFORE VS AFTER Plan Comparison Component */}
      <PlanComparisonTable comparisonData={simResult?.comparison} />

      {/* Minute-by-Minute Discrete Simulation Event Log */}
      {simResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Discrete Event Simulation Trace</h3>
              <p className="text-xs text-slate-500">Chronological simulator log of section occupancies and clearings</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              {simResult.events_sample?.length || 0} Sample Events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] font-sans">
                <tr>
                  <th className="py-2.5 px-4">Sim Timestamp</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Section</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Delay Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simResult.events_sample?.map((e: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">{e.timestamp?.slice(11, 19)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 font-sans">{e.event_type}</td>
                    <td className="py-2.5 px-4 text-slate-600">{e.entity_type} #{e.entity_id}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold">Sec #{e.section_id}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans truncate max-w-sm">{e.description}</td>
                    <td className="py-2.5 px-4 font-bold">
                      {e.impact_minutes > 0 ? (
                        <span className="text-amber-600">+{e.impact_minutes}m</span>
                      ) : (
                        <span className="text-slate-400">0m</span>
                      )}
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

export default Simulation
