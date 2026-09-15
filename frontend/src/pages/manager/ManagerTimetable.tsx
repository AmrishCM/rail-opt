import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchTrains, fetchBlockWindows } from '../../services/api'
import {
  Calendar,
  Clock,
  Train,
  Layers,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

export const ManagerTimetable: React.FC = () => {
  const [trains, setTrains] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trainsRes, blocksRes] = await Promise.all([
        fetchTrains(),
        fetchBlockWindows({ corridor_id: 2 })
      ])
      setTrains(trainsRes || [])
      setBlocks(blocksRes || [])
    } catch (err) {
      console.error('Failed to load manager timetable:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Operations Timetable & Possession Coordination</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Central Timetable & Corridor Schedule</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Combined view of passenger paths, freight runs, and active track possessions
          </p>
        </div>

        <Link
          to="/manager/replan"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all shadow-md shadow-purple-600/20 shrink-0 min-h-[44px]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Replanning Center</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading master timetable...</div>
      ) : (
        <div className="space-y-6">
          {/* Scheduled Possessions Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Scheduled Maintenance Blocks & Possessions</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">{blocks.length} Windows</span>
            </div>

            {blocks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No maintenance possessions scheduled today.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blocks.map((b) => (
                  <div
                    key={b.window_id || b.id}
                    className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-amber-400">
                        BLOCK-{b.window_id || b.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {b.status || 'APPROVED'}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs">{b.title || 'Civil Track Welding Possession'}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
                      <span>Section: {b.section_name || 'Salem–Erode'}</span>
                      <span className="text-amber-300">{b.start_time || '14:00'} - {b.end_time || '16:30'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Master Train Timetable */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center space-x-2">
                <Train className="w-4 h-4" />
                <span>Active Train Timetable (Section C2-02)</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">{trains.length} Trains</span>
            </div>

            <div className="divide-y divide-slate-800">
              {trains.map((train) => (
                <div
                  key={train.train_id || train.train_number}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold shrink-0">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-white">{train.train_number}</span>
                        <span className="text-slate-300 font-bold">{train.train_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {train.origin} → {train.destination}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 font-mono text-right">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Departure</span>
                      <span className="text-emerald-400 font-bold">{train.departure_time || '10:30'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-sans">Max Speed</span>
                      <span className="text-slate-300">{train.max_speed || 110} km/h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerTimetable
