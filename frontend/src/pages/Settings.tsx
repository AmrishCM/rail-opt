import React, { useState, useEffect } from 'react'
import { fetchAdminConfig, updateAdminWeights } from '../services/api'
import { Settings as SettingsIcon, Save, ShieldCheck, CheckCircle2, Sliders, Lock } from 'lucide-react'

export const Settings: React.FC = () => {
  const [wAsset, setWAsset] = useState<number>(30)
  const [wTrain, setWTrain] = useState<number>(25)
  const [wPriority, setWPriority] = useState<number>(20)
  const [wCoord, setWCoord] = useState<number>(15)
  const [wEfficiency, setWEfficiency] = useState<number>(10)

  const [headway, setHeadway] = useState<number>(15)
  const [protectionMargin, setProtectionMargin] = useState<number>(25)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchAdminConfig().then((res) => {
      const w = res?.config?.weights
      if (w) {
        setWAsset(Math.round(w.weight_asset_availability * 100))
        setWTrain(Math.round(w.weight_train_impact * 100))
        setWPriority(Math.round(w.weight_maintenance_priority * 100))
        setWCoord(Math.round(w.weight_coordination * 100))
        setWEfficiency(Math.round(w.weight_block_efficiency * 100))
      }
    }).catch(console.error)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateAdminWeights({
        weight_asset_availability: wAsset / 100.0,
        weight_train_impact: wTrain / 100.0,
        weight_maintenance_priority: wPriority / 100.0,
        weight_coordination: wCoord / 100.0,
        weight_block_efficiency: wEfficiency / 100.0
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to update config:', err)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Solver Configuration & Operational Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global mathematical objective weights, train headway buffers, and CP-SAT solver timeouts.
          </p>
        </div>

        {saved && (
          <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Policy Saved</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Objective Function Weights Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Default Multi-Objective Optimization Weights</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Asset Availability Weight (%)</label>
              <input
                type="number"
                value={wAsset}
                onChange={(e) => setWAsset(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Train Disruption Minimization (%)</label>
              <input
                type="number"
                value={wTrain}
                onChange={(e) => setWTrain(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Maintenance Priority Completion (%)</label>
              <input
                type="number"
                value={wPriority}
                onChange={(e) => setWPriority(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Cross-Department Coordination (%)</label>
              <input
                type="number"
                value={wCoord}
                onChange={(e) => setWCoord(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Train Headway & Safety Buffers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Train Protection Headway & Safety Margins</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Minimum Train Headway (minutes)</label>
              <input
                type="number"
                value={headway}
                onChange={(e) => setHeadway(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Express Train Clearance Buffer (minutes)</label>
              <input
                type="number"
                value={protectionMargin}
                onChange={(e) => setProtectionMargin(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Operational Policy</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
