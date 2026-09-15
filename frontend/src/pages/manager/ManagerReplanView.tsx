import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchCriticalEvents,
  replanCriticalEvent,
  triggerReplan,
  fetchPlans,
  approvePlan
} from '../../services/api'
import {
  RotateCcw,
  AlertTriangle,
  Train,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileCheck
} from 'lucide-react'

export const ManagerReplanView: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [replanning, setReplanning] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [eventsRes, plansRes] = await Promise.all([
        fetchCriticalEvents(),
        fetchPlans({ corridor_id: 2 })
      ])
      const evList = eventsRes || []
      setEvents(evList)
      if (evList.length > 0) {
        setSelectedEvent(evList[0])
      }
      setPlans(plansRes || [])
    } catch (err) {
      console.error('Failed to load replanning data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleTriggerReplan = async (eventId: number) => {
    setReplanning(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await replanCriticalEvent(eventId)
      setSuccessMsg(res?.message || 'Dynamic CP-SAT Replan generated and saved to audit log.')
      await loadData()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Replanning failed. Please verify optimization constraints.')
    } finally {
      setReplanning(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <RotateCcw className="w-4 h-4" />
            <span>Mathematical Rescheduling & Conflict Resolution</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Dynamic Replanning Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Resolve unscheduled track defects, emergency speed restrictions, and train path conflicts
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            Manager Operational Authority
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 flex items-center space-x-3 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Replanning Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Disruption Events & Conflicted Blocks (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">
            Active Disruption Events & Conflicts
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading critical events...</div>
          ) : events.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white">No active disruption events</p>
              <p className="text-[11px] text-slate-500">Current corridor timetable is running with zero detected conflicts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => {
                const isSelected = selectedEvent?.event_id === ev.event_id
                return (
                  <div
                    key={ev.event_id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-900/30 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-black text-amber-400">
                        {ev.event_code || `EV-${ev.event_id}`}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {ev.severity || 'HIGH'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      {ev.title || ev.description}
                    </h3>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Section: {ev.section_code || 'C2-02'}</span>
                      <span className="text-purple-400 font-semibold font-mono">
                        {ev.replan_required ? 'Replan Required' : 'Monitored'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Replan Execution & Impact Simulation (7 cols) */}
        {selectedEvent ? (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-purple-400">
                  {selectedEvent.event_code || `EVENT-${selectedEvent.event_id}`}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Status: {selectedEvent.status || 'OPEN'}
                </span>
              </div>
              <h2 className="text-base font-black text-white">
                {selectedEvent.title || selectedEvent.description}
              </h2>
            </div>

            {/* Impact & Conflict Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Affected Section</div>
                <div className="font-bold text-white mt-0.5">{selectedEvent.section_code || 'Salem–Erode (C2-02)'}</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Track / Line</div>
                <div className="font-bold text-blue-400 mt-0.5">Track 2 (Down Line)</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="text-[10px] text-slate-400 uppercase">Conflict Severity</div>
                <div className="font-bold text-red-400 mt-0.5">{selectedEvent.severity || 'CRITICAL'}</div>
              </div>
            </div>

            {/* Proposed CP-SAT Replan Solution */}
            <div className="p-4 bg-purple-950/40 border border-purple-800/50 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-purple-300 font-bold">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Proposed Mathematical Replan (CP-SAT Solver)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Re-routes freight paths to Track 1; preserves 12675 Kovai Express without secondary delay; advances maintenance possession from 15:30 to 14:00.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 bg-slate-900/80 rounded-lg text-slate-300">
                  Delay Saved: <strong className="text-emerald-400">+42 mins</strong>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg text-slate-300">
                  Passenger Delay: <strong className="text-emerald-400">0 mins</strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleTriggerReplan(selectedEvent.event_id)}
                disabled={replanning}
                className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 min-h-[48px]"
              >
                {replanning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>TRIGGER CP-SAT REPLAN & PUBLISH</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Published replan immediately updates the central timetable and dispatches notifications to field gangs.
            </p>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-400">
            Select a disruption event on the left to review proposed replan.
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagerReplanView
