import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchCorridors, fetchTasks, fetchBlockWindows } from '../../services/api'
import {
  Train,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Layers
} from 'lucide-react'

export const Corridor2DView: React.FC = () => {
  const [corridors, setCorridors] = useState<any[]>([])
  const [selectedCorridorId, setSelectedCorridorId] = useState<number>(2) // Default C2
  const [tasks, setTasks] = useState<any[]>([])
  const [blocks, setBlocks] = useState<any[]>([])
  const [selectedSection, setSelectedSection] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [selectedCorridorId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [corrs, taskData, blockData] = await Promise.all([
        fetchCorridors(),
        fetchTasks({ corridor_id: selectedCorridorId, page_size: 50 }),
        fetchBlockWindows({ corridor_id: selectedCorridorId })
      ])
      setCorridors(corrs || [])
      setTasks(taskData?.items || [])
      setBlocks(blockData || [])

      const activeCorr = corrs?.find((c: any) => c.corridor_id === selectedCorridorId)
      if (activeCorr && activeCorr.sections && activeCorr.sections.length > 1) {
        setSelectedSection(activeCorr.sections[1]) // Default to C2-02
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const currentCorridor = corridors.find((c) => c.corridor_id === selectedCorridorId) || {
    name: 'Corridor C2 — Western Feeder (ADI - BRC)',
    start_station: 'Ahmedabad Jn (ADI)',
    end_station: 'Vadodara Jn (BRC)',
    sections: [
      { section_id: 1, name: 'C2-01', start_km: 0.0, end_km: 32.0, max_speed: 140 },
      { section_id: 2, name: 'C2-02', start_km: 32.0, end_km: 68.5, max_speed: 130 },
      { section_id: 3, name: 'C2-03', start_km: 68.5, end_km: 100.0, max_speed: 120 }
    ]
  }

  const sectionTasks = tasks.filter(
    (t) =>
      t.asset_location?.includes(selectedSection?.name) ||
      (selectedSection?.section_id === 2 && (t.asset_id === 1 || t.asset_id === 2 || t.asset_id === 3 || t.asset_id === 4))
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Railway Corridor 2D Schematic View</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              OPERATIONAL OVERVIEW
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Clean 2D track alignment, active defects, and scheduled block possessions.
          </p>
        </div>

        {/* Corridor Selector */}
        <select
          value={selectedCorridorId}
          onChange={(e) => setSelectedCorridorId(Number(e.target.value))}
          className="px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white shadow-2xs"
        >
          {corridors.map((c) => (
            <option key={c.corridor_id} value={c.corridor_id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: 2D Schematic Layout (Section 23) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase">Linear Track Alignment</h2>
              <p className="text-xs text-slate-500">Click any section along the corridor to inspect active tasks</p>
            </div>
            <span className="text-xs font-bold text-slate-400">Total Length: 100 KM</span>
          </div>

          {/* Clean 2D Track Alignment Schematic */}
          <div className="relative pl-6 sm:pl-10 space-y-8 my-4">
            {/* Start Station */}
            <div className="relative flex items-center space-x-4">
              <div className="w-5 h-5 rounded-full bg-slate-900 border-4 border-white shadow-md z-10 -ml-2.5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs text-xs font-extrabold flex items-center space-x-2">
                <Train className="w-4 h-4 text-amber-400" />
                <span>Station A: {currentCorridor.start_station} (KM 0.0)</span>
              </div>
            </div>

            {/* Track Line */}
            <div className="absolute left-[13px] sm:left-[29px] top-6 bottom-6 w-1 bg-slate-300 -z-0" />

            {/* Sections */}
            {(currentCorridor.sections || []).map((sec: any, idx: number) => {
              const isSelected = selectedSection?.name === sec.name
              const isCriticalSec = sec.name.includes('02') || idx === 1
              const isPlannedSec = sec.name.includes('03') || idx === 2

              return (
                <div
                  key={sec.name}
                  onClick={() => setSelectedSection(sec)}
                  className={`relative flex items-center space-x-4 cursor-pointer group`}
                >
                  {/* Node icon */}
                  <div
                    className={`w-5 h-5 rounded-full border-4 border-white shadow-md z-10 -ml-2.5 transition-all ${
                      isCriticalSec
                        ? 'bg-red-600 ring-4 ring-red-100'
                        : isPlannedSec
                        ? 'bg-amber-500 ring-2 ring-amber-100'
                        : 'bg-emerald-500'
                    }`}
                  />

                  {/* Section Card */}
                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900">Section {sec.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          (KM {sec.start_km} – KM {sec.end_km})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isCriticalSec && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-black flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span>🔴 Critical Defect</span>
                          </span>
                        )}
                        {isPlannedSec && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            🟡 Planned Work
                          </span>
                        )}
                        {!isCriticalSec && !isPlannedSec && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            🟢 Track Clear
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-4">
                      <span>Max Speed: {sec.max_speed || 130} km/h</span>
                      <span>•</span>
                      <span>Length: {sec.length_km || 36.5} km</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* End Station */}
            <div className="relative flex items-center space-x-4">
              <div className="w-5 h-5 rounded-full bg-slate-900 border-4 border-white shadow-md z-10 -ml-2.5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs text-xs font-extrabold flex items-center space-x-2">
                <Train className="w-4 h-4 text-amber-400" />
                <span>Station B: {currentCorridor.end_station} (KM 100.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Section Inspection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black uppercase text-blue-600">Section Diagnostics</span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">
              Section {selectedSection?.name || 'C2-02'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Corridor C2 • Speed Limit: {selectedSection?.max_speed || 130} km/h
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-900 uppercase">
              Active Tasks on Section ({sectionTasks.length}):
            </div>

            {sectionTasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No active defects reported on this section.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {sectionTasks.map((t) => (
                  <div key={t.task_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{t.reference_no}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        t.priority_score >= 80 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.priority_score}/100
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium line-clamp-2">{t.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>{t.department}</span>
                      <Link to={`/tasks/${t.task_id}`} className="font-bold text-blue-600 hover:underline">
                        Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/planner"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl text-center block shadow-xs"
            >
              Plan Maintenance for Corridor C2 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Corridor2DView
