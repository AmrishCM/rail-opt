import React, { useState, useEffect } from 'react'
import { fetchPresetScenarios, triggerReplan, fetchPlans } from '../services/api'
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react'

export const Scenarios: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1)
  const [presets, setPresets] = useState<any[]>([])
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null)

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
      if (res && res.length > 0) setSelectedPlanId(res[0].plan_id)
    }).catch(console.error)

    fetchPresetScenarios().then((res) => {
      const p = res?.presets || []
      setPresets(p)
      if (p.length > 0) setSelectedPreset(p[0])
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              What-If Scenario & Dynamic Replanning Studio
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              REAL-TIME RESCHEDULING
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Simulate sudden defects, cancelled possession windows, and traffic disruptions with instant mathematical re-optimization.
          </p>
        </div>

        <button
          onClick={handleTriggerReplan}
          disabled={isReplanning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isReplanning ? 'animate-spin' : ''}`} />
          <span>{isReplanning ? 'Re-optimizing...' : 'Execute dynamic re-plan'}</span>
        </button>
      </div>

      {/* Preset Scenarios Gallery */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          Preset Railway Disturbance Scenarios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p) => {
            const isSelected = selectedPreset?.id === p.id
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                  {p.category}
                </span>
                <h4 className="font-medium text-xs text-zinc-100 mt-2">{p.name}</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Disturbance Event Configuration Form */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <h3 className="font-medium text-sm text-zinc-100 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Configured Disturbance Event</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-mono text-zinc-400 block mb-1 uppercase text-[10px]">Base Schedule Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono text-xs outline-none focus:border-blue-500"
            >
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id} className="bg-zinc-900">
                  Plan #{p.plan_id} - {p.plan_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-zinc-400 block mb-1 uppercase text-[10px]">Disturbance Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono text-xs outline-none focus:border-blue-500"
            >
              <option value="NEW_CRITICAL_DEFECT" className="bg-zinc-900">New Critical Defect Reported</option>
              <option value="CANCEL_BLOCK" className="bg-zinc-900">Block Possession Cancelled</option>
              <option value="TRAIN_SURGE" className="bg-zinc-900">Special Express Train Added</option>
              <option value="CREW_UNAVAILABLE" className="bg-zinc-900">Maintenance Crew Shortage</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-zinc-400 block mb-1 uppercase text-[10px]">Affected Section</label>
            <select
              value={eventSection}
              onChange={(e) => setEventSection(Number(e.target.value))}
              className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono text-xs outline-none focus:border-blue-500"
            >
              <option value={1} className="bg-zinc-900">Section C1-S1 (NDLS - GZB)</option>
              <option value={2} className="bg-zinc-900">Section C1-S2 (GZB - ALJN)</option>
              <option value={3} className="bg-zinc-900">Section C1-S3 (ALJN - TDL)</option>
              <option value={4} className="bg-zinc-900">Section C1-S4 (TDL - CNB)</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-zinc-400 block mb-1 uppercase text-[10px]">Defect Severity</label>
            <select
              value={eventSeverity}
              onChange={(e) => setEventSeverity(e.target.value)}
              className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 font-mono text-xs outline-none focus:border-blue-500"
            >
              <option value="CRITICAL" className="bg-zinc-900">CRITICAL (Priority 1)</option>
              <option value="HIGH" className="bg-zinc-900">HIGH (Priority 2)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-mono text-zinc-400 block mb-1 text-[10px] uppercase">Event Description / Incident Log</label>
          <input
            type="text"
            value={eventDesc}
            onChange={(e) => setEventDesc(e.target.value)}
            className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-xs text-zinc-200 font-mono outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono">
          {error}
        </div>
      )}

      {/* Dynamic Re-plan Diff Results */}
      {replanResult && (
        <div className="space-y-4">
          {/* Re-plan Summary Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-base text-zinc-100">
                  Dynamic Re-Plan Generated (#{replanResult.new_plan_id})
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                RE-OPTIMIZED
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-500 uppercase">Operational Reasons & Strategy:</span>
              <ul className="space-y-1 text-xs text-zinc-300 list-disc pl-5">
                {replanResult.reason_summary?.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Changed Assignments Diff Table */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div>
                <h3 className="font-medium text-zinc-100 text-sm">Schedule Assignment Diffs</h3>
                <p className="text-xs text-zinc-500">Tasks adjusted by the optimizer to absorb the disturbance</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {replanResult.changed_assignments?.length || 0} Adjustments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Task ID</th>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-4">Modification Type</th>
                    <th className="py-3 px-4">New Block Assigned</th>
                    <th className="py-3 px-4">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {replanResult.changed_assignments?.map((diff: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-zinc-200">T-{diff.task_id}</td>
                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{diff.task_description}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          diff.change_type === 'NEWLY_SCHEDULED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : diff.change_type.includes('EARLIER')
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {diff.change_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-blue-400">
                        {diff.new_block_id ? `Block #${diff.new_block_id}` : 'Unchanged'}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 italic">{diff.reason}</td>
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
