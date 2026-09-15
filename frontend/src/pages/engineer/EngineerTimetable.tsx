import React, { useState, useEffect } from 'react'
import { fetchTrains, fetchBlockWindows } from '../../services/api'
import {
  Calendar,
  Clock,
  Train,
  Layers,
  MapPin,
  CheckCircle2,
  Lock
} from 'lucide-react'

export const EngineerTimetable: React.FC = () => {
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
      console.error('Failed to load engineer timetable:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Corridor Schedule (Section C2-02)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Maintenance Timetable View</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational possession windows and train clearing requirements (Read-Only)
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Execution Scope: Read-Only Timetable</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading timetable...</div>
      ) : (
        <div className="space-y-6">
          {/* Approved Possessions */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Assigned Maintenance Possessions</span>
            </h2>

            {blocks.length === 0 ? (
              <p className="text-xs text-slate-400">No active possessions scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blocks.map((b) => (
                  <div key={b.window_id || b.id} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-amber-400">BLOCK-{b.window_id || b.id}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {b.status || 'APPROVED'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{b.title || 'Track Welding & Joint Replacement'}</div>
                    <div className="text-[11px] text-slate-400 flex justify-between pt-1 font-mono">
                      <span>Track {b.track_number || '2'}</span>
                      <span className="text-amber-400 font-bold">{b.start_time || '14:00'} - {b.end_time || '16:30'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trains View */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-black uppercase text-blue-400 tracking-wider flex items-center space-x-2">
              <Train className="w-4 h-4" />
              <span>Train Clearance Timeline</span>
            </h2>

            <div className="divide-y divide-slate-800">
              {trains.map((train) => (
                <div key={train.train_id || train.train_number} className="py-3 flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3">
                    <Train className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">{train.train_number} • {train.train_name}</div>
                      <div className="text-[11px] text-slate-400">{train.origin} → {train.destination}</div>
                    </div>
                  </div>
                  <div className="font-mono text-right">
                    <div className="text-emerald-400 font-bold">{train.departure_time || '10:30'}</div>
                    <div className="text-[10px] text-slate-500">Track 1</div>
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

export default EngineerTimetable
