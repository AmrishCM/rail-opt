import React, { useState, useEffect } from 'react'
import { fetchTrains, fetchBlockWindows } from '../../services/api'
import {
  Calendar,
  Clock,
  Train,
  Shield,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export const InspectorTimetable: React.FC = () => {
  const [trains, setTrains] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'TRAINS' | 'BLOCKS'>('TRAINS')

  useEffect(() => {
    loadTimetable()
  }, [])

  const loadTimetable = async () => {
    setLoading(true)
    try {
      const [trainsRes, blocksRes] = await Promise.all([
        fetchTrains(),
        fetchBlockWindows({ corridor_id: 2 })
      ])
      setTrains(trainsRes || [])
      setBlocks(blocksRes || [])
    } catch (err) {
      console.error('Failed to load timetable:', err)
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
            <span>Corridor Schedule (Section C2-02)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Daily Operational Timetable</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time train movements and scheduled engineering possessions
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab('TRAINS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center space-x-1.5 ${
              activeTab === 'TRAINS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>Passenger & Freight Trains</span>
          </button>
          <button
            onClick={() => setActiveTab('BLOCKS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all min-h-[40px] flex items-center space-x-1.5 ${
              activeTab === 'BLOCKS'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Maintenance Windows</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading operational timetable...
        </div>
      ) : activeTab === 'TRAINS' ? (
        <div className="space-y-3">
          {trains.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              No train schedules returned from corridor database.
            </div>
          ) : (
            trains.map((train) => (
              <div
                key={train.train_id || train.train_number}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Train className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-400">{train.train_number}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {train.train_type || 'EXPRESS'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {train.train_name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{train.origin}</span>
                      <span>→</span>
                      <span>{train.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Scheduled</span>
                    <span className="text-emerald-400 font-bold">{train.departure_time || '10:30'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Speed</span>
                    <span className="text-slate-200 font-bold">{train.max_speed || 110} km/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Line</span>
                    <span className="text-blue-400 font-bold">Track 1</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              No active maintenance possessions scheduled for this corridor today.
            </div>
          ) : (
            blocks.map((b) => (
              <div
                key={b.window_id || b.id}
                className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-amber-400">
                      BLOCK-{b.window_id || b.id}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {b.status || 'APPROVED POSSESSION'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{b.title || 'Track & OHE Maintenance Window'}</h3>
                  <div className="text-xs text-slate-400">
                    Location: <strong className="text-slate-300">{b.section_name || 'Salem–Erode'}</strong> • Track: <strong className="text-blue-400">{b.track_number || 'Track 2'}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-4 font-mono text-xs">
                  <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Duration</div>
                    <div className="text-amber-400 font-bold">{b.duration_minutes || 150} mins</div>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-sans">Window</div>
                    <div className="text-emerald-400 font-bold">{b.start_time || '14:00'} - {b.end_time || '16:30'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default InspectorTimetable
