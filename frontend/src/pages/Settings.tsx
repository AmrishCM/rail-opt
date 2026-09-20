import React, { useState, useEffect } from 'react'
import { fetchConfig, updateConfig } from '../services/api'
import {
  Sliders,
  ShieldCheck,
  Cpu,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [wAsset, setWAsset] = useState(30)
  const [wTrain, setWTrain] = useState(25)
  const [wPriority, setWPriority] = useState(20)
  const [wCoord, setWCoord] = useState(15)
  const [headway, setHeadway] = useState(5)
  const [protectionMargin, setProtectionMargin] = useState(10)
  const [maxSolverTime, setMaxSolverTime] = useState(10)

  useEffect(() => {
    fetchConfig()
      .then((data) => {
        setConfig(data)
        if (data) {
          setWAsset(Math.round((data.w_asset_availability || 0.3) * 100))
          setWTrain(Math.round((data.w_train_delay || 0.25) * 100))
          setWPriority(Math.round((data.w_task_priority || 0.2) * 100))
          setWCoord(Math.round((data.w_coordination || 0.15) * 100))
          setHeadway(data.min_headway_minutes || 5)
          setProtectionMargin(data.express_train_protection_margin_minutes || 10)
          setMaxSolverTime(data.max_solver_time_seconds || 10)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateConfig({
        w_asset_availability: wAsset / 100,
        w_train_delay: wTrain / 100,
        w_task_priority: wPriority / 100,
        w_coordination: wCoord / 100,
        min_headway_minutes: headway,
        express_train_protection_margin_minutes: protectionMargin,
        max_solver_time_seconds: maxSolverTime
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to update config:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Operational Policy &bull; Engine Parameters</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Solver Configuration &amp; Operational Policy
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Global mathematical objective weights, train headway buffers, and CP-SAT solver timeouts
          </p>
        </div>

        {saved && (
          <span className="flex items-center space-x-1.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
            <span>Policy Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Objective Function Weights Card */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200 flex items-center space-x-2">
            <Sliders className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>Default Multi-Objective Optimization Weights</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Asset Availability Weight (%)</label>
              <input
                type="number"
                value={wAsset}
                onChange={(e) => setWAsset(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Train Disruption Minimization (%)</label>
              <input
                type="number"
                value={wTrain}
                onChange={(e) => setWTrain(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Maintenance Priority Completion (%)</label>
              <input
                type="number"
                value={wPriority}
                onChange={(e) => setWPriority(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Cross-Department Coordination (%)</label>
              <input
                type="number"
                value={wCoord}
                onChange={(e) => setWCoord(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Train Headway & Safety Buffers */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-200 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>Train Protection Headway &amp; Safety Margins</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Minimum Train Headway (minutes)</label>
              <input
                type="number"
                value={headway}
                onChange={(e) => setHeadway(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase text-zinc-400 block">Express Train Clearance Buffer (minutes)</label>
              <input
                type="number"
                value={protectionMargin}
                onChange={(e) => setProtectionMargin(Number(e.target.value))}
                className="w-full p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
