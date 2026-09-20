import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCorridors } from '../services/api'
import { ArrowRight, MapPin, Loader2 } from 'lucide-react'

export const Corridors: React.FC = () => {
  const [corridors, setCorridors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCorridors().then((res) => {
      setCorridors(res || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Railway Corridors & Sections
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Section topography, route density, line capacity, and real-time maintenance possession windows.
          </p>
        </div>
        <span className="text-xs font-mono font-medium px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {corridors.length} MONITORED CORRIDORS
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-mono">Loading corridors data...</span>
        </div>
      ) : (
        /* Corridors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {corridors.map((c) => (
            <div key={c.corridor_id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  CORRIDOR #{c.corridor_id}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Density: Level {c.traffic_level}/5
                </span>
              </div>

              <div>
                <h3 className="font-medium text-base text-zinc-100">{c.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{c.start_station} &rarr; {c.end_station}</span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">Route Capacity</span>
                  <span className="font-mono text-zinc-200">{c.route_capacity || 20} trains/hr</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block">Track Sections</span>
                  <span className="font-mono text-zinc-200">{c.sections?.length || 4} sections</span>
                </div>
              </div>

              {/* Visual Section Schematic Strip */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Section Schematic
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {c.sections?.slice(0, 4).map((s: any) => (
                    <div key={s.section_id} className="bg-zinc-950/60 border border-zinc-800 rounded p-1.5 text-center">
                      <span className="text-[10px] text-zinc-300 block truncate">{s.name}</span>
                      <span className="text-[9px] font-mono text-zinc-500">{s.length_km}km</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to={`/corridors/${c.corridor_id}`}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>View Corridor Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Corridors
