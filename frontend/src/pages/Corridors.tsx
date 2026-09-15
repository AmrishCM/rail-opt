import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCorridors } from '../services/api'
import { GitCommit, Train, ArrowRight, ShieldCheck, MapPin, Activity, Gauge } from 'lucide-react'

export const Corridors: React.FC = () => {
  const [corridors, setCorridors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCorridors().then((res) => {
      setCorridors(res || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Railway Corridors & Sections Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section topography, route density, line capacity, and real-time maintenance possession windows.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
          {corridors.length} MONITORED CORRIDORS
        </span>
      </div>

      {/* Corridors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {corridors.map((c) => (
          <div key={c.corridor_id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                CORRIDOR #{c.corridor_id}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Density: Level {c.traffic_level}/5
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">{c.name}</h3>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{c.start_station} &rarr; {c.end_station}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Route Capacity</span>
                <span className="font-extrabold text-slate-800">{c.route_capacity || 20} trains/hr</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Track Sections</span>
                <span className="font-extrabold text-slate-800">{c.sections?.length || 4} sections</span>
              </div>
            </div>

            {/* Visual Section Schematic Strip */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Section Schematic
              </span>
              <div className="grid grid-cols-4 gap-1">
                {c.sections?.slice(0, 4).map((s: any) => (
                  <div key={s.section_id} className="bg-slate-100 rounded p-1.5 text-center">
                    <span className="text-[10px] font-bold text-slate-700 block truncate">{s.name}</span>
                    <span className="text-[9px] text-slate-400">{s.length_km}km</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to={`/corridors/${c.corridor_id}`}
              className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>View Corridor Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Corridors
