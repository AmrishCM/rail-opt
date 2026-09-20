import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchCorridor, fetchBlockWindows, fetchTrainMovements } from '../services/api'
import { CorridorTimeline } from '../components/corridor/CorridorTimeline'
import {
  ArrowLeft,
  Loader2
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
        <h2 className="text-lg font-medium text-zinc-100">Corridor Not Found</h2>
        <Link to="/corridors" className="text-xs font-mono text-blue-400 hover:underline">Back to Corridors</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div className="flex items-center space-x-3">
          <Link
            to="/corridors"
            className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                {corridor?.name || 'Corridor Intelligence View'}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Level {corridor?.traffic_level}/5 Traffic
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {corridor?.start_station} to {corridor?.end_station} • Section Topography & Possession Slots
            </p>
          </div>
        </div>

        <Link
          to="/planner"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors text-center"
        >
          Optimize This Corridor
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-mono">Loading corridor telemetry...</span>
        </div>
      ) : (
        <>
          {/* Railway Corridor Topographical Intelligence Schematic (Station A -> B) */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
            <h3 className="font-medium text-sm text-zinc-100">
              Corridor Topographical Schematic ({corridor?.start_station} &rarr; {corridor?.end_station})
            </h3>

            <div className="relative pl-6 border-l-2 border-zinc-800 space-y-8 my-2">
              {/* Station A Node */}
              <div className="relative">
                <div className="absolute -left-[31px] -top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-zinc-900"></div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg max-w-sm">
                  <span className="text-[10px] uppercase font-mono text-blue-400 block">Origin Terminal</span>
                  <span className="font-medium text-sm text-zinc-100">{corridor?.start_station || 'Origin Station'}</span>
                </div>
              </div>

              {/* Sections List */}
              {corridor?.sections?.map((sec: any) => (
                <div key={sec.section_id} className="relative bg-zinc-950/60 border border-zinc-800 p-4 rounded-lg space-y-3">
                  <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-zinc-700 ring-4 ring-zinc-900"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                    <div>
                      <span className="font-medium text-xs text-zinc-200">{sec.name}</span>
                      <span className="text-[11px] text-zinc-500 ml-2 font-mono">
                        (KM {sec.start_km} &rarr; KM {sec.end_km}, {sec.length_km} km)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono text-zinc-400">Speed Limit: {sec.max_speed} km/h</span>
                    </div>
                  </div>

                  {/* Department Asset Status on this Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Track / Civil</span>
                      <span className="font-medium text-rose-400 flex items-center space-x-1 mt-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>1 Critical Defect</span>
                      </span>
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">S&T / Signalling</span>
                      <span className="font-medium text-amber-400 flex items-center space-x-1 mt-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Planned Overhaul</span>
                      </span>
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Traction (TRD)</span>
                      <span className="font-medium text-emerald-400 flex items-center space-x-1 mt-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Ready / Clear</span>
                      </span>
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Train Timetable</span>
                      <span className="font-mono text-zinc-300 flex items-center space-x-1 mt-1 text-xs">
                        <span>4 Scheduled Paths</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Station B Node */}
              <div className="relative">
                <div className="absolute -left-[31px] -top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-zinc-900"></div>
                <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg max-w-sm">
                  <span className="text-[10px] uppercase font-mono text-blue-400 block">Destination Terminal</span>
                  <span className="font-medium text-sm text-zinc-100">{corridor?.end_station || 'Destination Station'}</span>
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
        </>
      )}
    </div>
  )
}

export default CorridorDetail
