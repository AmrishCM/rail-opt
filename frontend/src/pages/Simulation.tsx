import React, { useState, useEffect } from 'react'
import { runSimulation, fetchPlans } from '../services/api'
import { PlanComparisonTable } from '../components/planner/PlanComparisonTable'
import { PlayCircle } from 'lucide-react'

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Deterministic Discrete-Event Simulator
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              REPRODUCIBLE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Validates railway schedule performance by simulating trains, block possessions, delays, and asset downtime minute-by-minute.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 rounded text-xs">
            <span className="text-zinc-500 font-mono">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-16 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200 font-mono text-xs outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-2 px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
          >
            <PlayCircle className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Run simulation & evaluate'}</span>
          </button>
        </div>
      </div>

      {/* Target Plan Selector */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono text-zinc-400">Select Plan to Simulate:</span>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(Number(e.target.value))}
            className="p-2 border border-zinc-700 rounded text-xs font-mono bg-zinc-950 text-zinc-200 outline-none focus:border-blue-500"
          >
            {plans.map((p) => (
              <option key={p.plan_id} value={p.plan_id} className="bg-zinc-900">
                Plan #{p.plan_id} - {p.plan_name} ({p.assignments?.length || 0} tasks)
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-zinc-500 font-mono">Independent evaluator isolated from optimizer</span>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono">
          {error}
        </div>
      )}

      {/* BEFORE VS AFTER Plan Comparison */}
      <PlanComparisonTable comparisonData={simResult?.comparison} />

      {/* Discrete Simulation Event Log */}
      {simResult && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
            <div>
              <h3 className="font-medium text-zinc-100 text-sm">Discrete Event Simulation Trace</h3>
              <p className="text-xs text-zinc-500">Chronological simulator log of section occupancies and clearings</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              {simResult.events_sample?.length || 0} events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Sim Timestamp</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Section</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Delay Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {simResult.events_sample?.map((e: any, idx: number) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-zinc-500">{e.timestamp?.slice(11, 19)}</td>
                    <td className="py-2.5 px-4 font-medium text-zinc-200">{e.event_type}</td>
                    <td className="py-2.5 px-4 text-zinc-400">{e.entity_type} #{e.entity_id}</td>
                    <td className="py-2.5 px-4 text-zinc-300">Sec #{e.section_id}</td>
                    <td className="py-2.5 px-4 text-zinc-400 truncate max-w-sm">{e.description}</td>
                    <td className="py-2.5 px-4">
                      {e.impact_minutes > 0 ? (
                        <span className="text-amber-400">+{e.impact_minutes}m</span>
                      ) : (
                        <span className="text-zinc-600">0m</span>
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
