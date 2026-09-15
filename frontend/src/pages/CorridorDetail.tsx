import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchCorridor, fetchBlockWindows, fetchTrainMovements } from '../services/api'
import { CorridorTimeline } from '../components/corridor/CorridorTimeline'
import {
  GitCommit,
  Train,
  ArrowLeft,
  ShieldAlert,
  Layers,
  MapPin,
  Clock,
  Zap,
  Gauge
} from 'lucide-react'

export const CorridorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [corridor, setCorridor] = useState<any | null>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [trains, setTrains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const corrId = Number(id || 1)
        const [cRes, bRes, trRes] = await Promise.all([
          fetchCorridor(corrId),
          fetchBlockWindows({ corridor_id: corrId }),
          fetchTrainMovements({ corridor_id: corrId })
        ])
        setCorridor(cRes)
        setBlocks(bRes || [])
        setTrains(trRes || [])
      } catch (err) {
        console.error('Failed to load corridor details:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (!corridor && !loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Corridor Not Found</h2>
        <Link to="/corridors" className="text-xs font-bold text-blue-600">Back to Corridors</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link
            to="/corridors"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {corridor?.name || 'Corridor Intelligence View'}
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                Level {corridor?.traffic_level}/5 Traffic
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {corridor?.start_station} to {corridor?.end_station} • Section Topography & Possession Slots
            </p>
          </div>
        </div>

        <Link
          to="/planner"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-all text-center"
        >
          Optimize This Corridor
        </Link>
      </div>

      {/* Railway Corridor Topographical Intelligence Schematic (Station A -> B) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="font-extrabold text-sm text-slate-900">
          Corridor Topographical Schematic (Station A &rarr; Station B)
        </h3>

        <div className="relative pl-6 border-l-2 border-slate-300 space-y-8 my-2">
          {/* Station A Node */}
          <div className="relative">
            <div className="absolute -left-[31px] -top-1 w-4 h-4 rounded-full bg-slate-900 ring-4 ring-slate-100"></div>
            <div className="bg-slate-900 text-white p-3 rounded-lg max-w-sm shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-300 block">Origin Terminal</span>
              <span className="font-extrabold text-sm">{corridor?.start_station || 'Origin Station'}</span>
            </div>
          </div>

          {/* Sections List */}
          {corridor?.sections?.map((sec: any) => (
            <div key={sec.section_id} className="relative bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-xs text-slate-900">{sec.name}</span>
                  <span className="text-[11px] text-slate-500 ml-2 font-medium">
                    (KM {sec.start_km} &rarr; KM {sec.end_km}, {sec.length_km} km)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-semibold text-slate-600">Speed Limit: {sec.max_speed} km/h</span>
                </div>
              </div>

              {/* Department Asset Status on this Section */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Track / Civil</span>
                  <span className="font-bold text-rose-600 flex items-center space-x-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>1 Critical Defect</span>
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">S&T / Signalling</span>
                  <span className="font-bold text-amber-600 flex items-center space-x-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Planned Overhaul</span>
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Traction (TRD)</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Ready / Clear</span>
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Train Timetable</span>
                  <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                    <span>🚆 4 Scheduled Paths</span>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Station B Node */}
          <div className="relative">
            <div className="absolute -left-[31px] -top-1 w-4 h-4 rounded-full bg-slate-900 ring-4 ring-slate-100"></div>
            <div className="bg-slate-900 text-white p-3 rounded-lg max-w-sm shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-300 block">Destination Terminal</span>
              <span className="font-extrabold text-sm">{corridor?.end_station || 'Destination Station'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Corridor Timeline */}
      <CorridorTimeline
        corridorName={corridor?.name}
        sections={corridor?.sections}
        blocks={blocks}
      />
    </div>
  )
}

export default CorridorDetail
