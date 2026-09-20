import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchCorridors, fetchTasks, fetchBlockWindows } from '../../services/api'
import { Train, Loader2 } from 'lucide-react'

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Railway Corridor 2D Schematic View</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              OPERATIONAL OVERVIEW
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Clean 2D track alignment, active defects, and scheduled block possessions.
          </p>
        </div>

        {/* Corridor Selector */}
        <select
          value={selectedCorridorId}
          onChange={(e) => setSelectedCorridorId(Number(e.target.value))}
          className="px-3 py-2 text-xs font-mono border border-zinc-800 rounded bg-zinc-950 text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          {corridors.map((c) => (
            <option key={c.corridor_id} value={c.corridor_id} className="bg-zinc-900 text-zinc-200">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-xs font-mono">Loading schematic layout...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: 2D Schematic Layout */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wide">Linear Track Alignment</h2>
                <p className="text-xs text-zinc-500">Click any section along the corridor to inspect active tasks</p>
              </div>
              <span className="text-xs font-mono text-zinc-500">Total Length: 100 KM</span>
            </div>

            {/* Clean 2D Track Alignment Schematic */}
            <div className="relative pl-6 sm:pl-10 space-y-8 my-4">
              {/* Start Station */}
              <div className="relative flex items-center space-x-4">
                <div className="w-5 h-5 rounded-full bg-zinc-950 border-4 border-zinc-700 shadow z-10 -ml-2.5 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg text-xs font-medium flex items-center space-x-2">
                  <Train className="w-4 h-4 text-zinc-400" />
                  <span>Station A: {currentCorridor.start_station} (KM 0.0)</span>
                </div>
              </div>

              {/* Track Line */}
              <div className="absolute left-[13px] sm:left-[29px] top-6 bottom-6 w-1 bg-zinc-800 -z-0" />

              {/* Sections */}
              {(currentCorridor.sections || []).map((sec: any, idx: number) => {
                const isSelected = selectedSection?.name === sec.name
                const isCriticalSec = sec.name.includes('02') || idx === 1
                const isPlannedSec = sec.name.includes('03') || idx === 2

                return (
                  <div
                    key={sec.name}
                    onClick={() => setSelectedSection(sec)}
                    className="relative flex items-center space-x-4 cursor-pointer group"
                  >
                    {/* Node icon */}
                    <div
                      className={`w-5 h-5 rounded-full border-4 border-zinc-900 shadow z-10 -ml-2.5 transition-all ${
                        isCriticalSec
                          ? 'bg-rose-500 ring-2 ring-rose-500/30'
                          : isPlannedSec
                          ? 'bg-amber-500 ring-2 ring-amber-500/30'
                          : 'bg-emerald-500 ring-2 ring-emerald-500/30'
                      }`}
                    />

                    {/* Section Card */}
                    <div
                      className={`flex-1 p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/20'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-zinc-100">Section {sec.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            (KM {sec.start_km} – KM {sec.end_km})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCriticalSec && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              <span>Critical Defect</span>
                            </span>
                          )}
                          {isPlannedSec && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                              Planned Work
                            </span>
                          )}
                          {!isCriticalSec && !isPlannedSec && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                              Track Clear
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center space-x-4 font-mono">
                        <span>Max Speed: {sec.max_speed || 130} km/h</span>
                        <span className="text-zinc-600">•</span>
                        <span>Length: {sec.length_km || 36.5} km</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* End Station */}
              <div className="relative flex items-center space-x-4">
                <div className="w-5 h-5 rounded-full bg-zinc-950 border-4 border-zinc-700 shadow z-10 -ml-2.5 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
                <div className="p-3 bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg text-xs font-medium flex items-center space-x-2">
                  <Train className="w-4 h-4 text-zinc-400" />
                  <span>Station B: {currentCorridor.end_station} (KM 100.0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Section Inspection Card */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] font-mono uppercase text-blue-400">Section Diagnostics</span>
              <h3 className="text-base font-medium text-zinc-100 mt-0.5">
                Section {selectedSection?.name || 'C2-02'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Corridor C2 • Speed Limit: {selectedSection?.max_speed || 130} km/h
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono text-zinc-400 uppercase">
                Active Tasks on Section ({sectionTasks.length}):
              </div>

              {sectionTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950/60 rounded border border-zinc-800">
                  No active defects reported on this section.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {sectionTasks.map((t) => (
                    <div key={t.task_id} className="p-3 bg-zinc-950/60 rounded border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-zinc-200">{t.reference_no}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          t.priority_score >= 80 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {t.priority_score}/100
                        </span>
                      </div>
                      <p className="text-zinc-400 font-normal line-clamp-2">{t.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-800/80">
                        <span>{t.department}</span>
                        <Link to={`/tasks/${t.task_id}`} className="font-mono text-blue-400 hover:underline">
                          Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action button */}
            <div className="pt-3 border-t border-zinc-800">
              <Link
                to="/planner"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded text-center block transition-colors"
              >
                Plan Maintenance for Corridor C2 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Corridor2DView
