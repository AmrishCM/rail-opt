import React, { useState, useEffect } from 'react'
import { fetchPresetScenarios, triggerReplan, fetchPlans } from '../services/api'
import {
  GitPullRequest,
  AlertTriangle,
  Zap,
  Play,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react'

export const Scenarios: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1)
  const [presets, setPresets] = useState<any[]>([])
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null)

  // Custom Event Form
  const [eventType, setEventType] = useState('NEW_CRITICAL_DEFECT')
  const [eventSection, setEventSection] = useState(2)
  const [eventDesc, setEventDesc] = useState('Urgent Signal Interlocking Failure detected on Section C1-S2')
  const [eventSeverity, setEventSeverity] = useState('CRITICAL')

  const [isReplanning, setIsReplanning] = useState(false)
  const [replanResult, setReplanResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans().then((res) => {
      setPlans(res || [])
      if (res && res.length > 0) {
        setSelectedPlanId(res[0].plan_id)
      }
    }).catch(console.error)

    fetchPresetScenarios().then((res) => {
      const p = res?.presets || []
      setPresets(p)
      if (p.length > 0) {
        setSelectedPreset(p[0])
      }
    }).catch(console.error)
  }, [])

  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset)
    setEventType(preset.event.type)
    setEventDesc(preset.description)
    if (preset.event.section_id) setEventSection(preset.event.section_id)
  }

  const handleTriggerReplan = async () => {
    setIsReplanning(true)
    setError(null)
    setReplanResult(null)

    try {
      const payload = {
        plan_id: selectedPlanId,
        event: {
          type: eventType,
          section_id: eventSection,
          corridor_id: 1,
          severity: eventSeverity,
          description: eventDesc
        }
      }
      const res = await triggerReplan(payload)
      setReplanResult(res)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Re-planning execution failed.')
    } finally {
      setIsReplanning(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              What-If Scenario & Dynamic Replanning Studio
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              REAL-TIME RESCHEDULING
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate sudden defects, cancelled possession windows, and traffic disruptions with instant mathematical re-optimization.
          </p>
        </div>

        <button
          onClick={handleTriggerReplan}
          disabled={isReplanning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
        >
          <RotateCcw className={`w-4 h-4 text-amber-400 ${isReplanning ? 'animate-spin' : ''}`} />
          <span>{isReplanning ? 'RE-OPTIMIZING...' : 'EXECUTE DYNAMIC RE-PLAN'}</span>
        </button>
      </div>

      {/* Preset Scenarios Gallery */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Preset Railway Disturbance Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => {
            const isSelected = selectedPreset?.id === p.id
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {p.category}
                </span>
                <h4 className="font-bold text-xs text-slate-900 mt-2">{p.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Disturbance Event Configuration Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Configured Disturbance Event</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Base Schedule Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-hidden font-semibold"
            >
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>
                  Plan #{p.plan_id} - {p.plan_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Disturbance Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-hidden font-semibold"
            >
              <option value="NEW_CRITICAL_DEFECT">New Critical Defect Reported</option>
              <option value="CANCEL_BLOCK">Block Possession Cancelled</option>
              <option value="TRAIN_SURGE">Special Express Train Added</option>
              <option value="CREW_UNAVAILABLE">Maintenance Crew Shortage</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Affected Section</label>
            <select
              value={eventSection}
              onChange={(e) => setEventSection(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-hidden font-semibold"
            >
              <option value={1}>Section C1-S1 (NDLS - GZB)</option>
              <option value={2}>Section C1-S2 (GZB - ALJN)</option>
              <option value={3}>Section C1-S3 (ALJN - TDL)</option>
              <option value={4}>Section C1-S4 (TDL - CNB)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Defect Severity</label>
            <select
              value={eventSeverity}
              onChange={(e) => setEventSeverity(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-hidden font-semibold"
            >
              <option value="CRITICAL">CRITICAL (Priority 1)</option>
              <option value="HIGH">HIGH (Priority 2)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">Event Description / Incident Log</label>
          <input
            type="text"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Dynamic Re-plan Diff Results */}
      {replanResult && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Re-plan Summary Card */}
          <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-base text-slate-100">
                  Dynamic Re-Plan Generated (#{replanResult.new_plan_id})
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                STATUS: RE-OPTIMIZED
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">Operational Reasons & Strategy:</span>
              <ul className="space-y-1 text-xs text-slate-200 list-disc pl-5">
                {replanResult.reason_summary?.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Changed Assignments Diff Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Schedule Assignment Diffs (What Changed?)</h3>
                <p className="text-xs text-slate-500">Tasks adjusted by the optimizer to absorb the disturbance</p>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {replanResult.changed_assignments?.length || 0} Adjustments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-4">Modification Type</th>
                    <th className="py-3 px-4">New Block Assigned</th>
                    <th className="py-3 px-4">Operational Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {replanResult.changed_assignments?.map((diff: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                        T-{diff.task_id}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-xs truncate">
                        {diff.task_description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          diff.change_type === 'NEWLY_SCHEDULED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : (diff.change_type.includes('EARLIER') ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-purple-50 text-purple-700 border-purple-200')
                        }`}>
                          {diff.change_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {diff.new_block_id ? `Block #${diff.new_block_id}` : 'Unchanged'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        {diff.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scenarios
