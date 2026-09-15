import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Filter, Calendar, Eye, Layers, Train as TrainIcon,
  Wrench, ShieldCheck, X, CheckCircle2, History
} from 'lucide-react'
import { fetchTimeline } from '../../services/api'

interface RailwayTimelineProps {
  corridorId?: number
  selectedDate?: string
  initialDepartment?: string
  onSelectPlan?: (planId: number) => void
}

export const RailwayTimeline: React.FC<RailwayTimelineProps> = ({
  corridorId = 2,
  selectedDate = '2026-09-15',
  initialDepartment = '',
  onSelectPlan
}) => {
  const [currentDate, setCurrentDate] = useState<string>(selectedDate)
  const [selectedCorridor, setSelectedCorridor] = useState<number>(corridorId)
  const [departmentFilter, setDepartmentFilter] = useState<string>(initialDepartment)
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null)

  const { data: timeline, isLoading, isError, refetch } = useQuery({
    queryKey: ['timeline', selectedCorridor, currentDate, departmentFilter, showHistory],
    queryFn: () => fetchTimeline({
      corridor_id: selectedCorridor,
      date: currentDate,
      department: departmentFilter || undefined,
      show_history: showHistory
    }),
    refetchInterval: 30000
  })

  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ]

  const handlePrevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setCurrentDate('2026-09-15')
  }

  // Minute to percentage conversion
  const calcLeft = (startMin: number) => {
    return `${Math.max(0, Math.min(100, (startMin / 1440) * 100))}%`
  }

  const calcWidth = (durationMin: number) => {
    return `${Math.max(1.5, Math.min(100, (durationMin / 1440) * 100))}%`
  }

  const getMaintenanceColor = (item: any) => {
    if (item.is_superseded || item.status === 'SUPERSEDED') {
      return 'bg-slate-300 text-slate-600 border border-dashed border-slate-400 line-through opacity-60'
    }
    if (item.status === 'COMPLETED') {
      return 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
    }
    if (item.status === 'IN_PROGRESS') {
      return 'bg-amber-600 text-white border-amber-700 shadow-sm animate-pulse'
    }
    if (item.priority_score >= 85 || item.type === 'emergency') {
      return 'bg-rose-600 text-white border-rose-700 shadow-sm'
    }
    return 'bg-sky-600 text-white border-sky-700 shadow-sm'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-railway-navy text-white shadow-xs">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base">Corridor Possession Timeline</h3>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                {timeline?.corridor_name || `Corridor C${selectedCorridor}`}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-fidelity minute-by-minute visualization: Train services vs Maintenance blocks
            </p>
          </div>
        </div>

        {/* Date, Corridor & Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Corridor Selector */}
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value={1}>Corridor C1 (Delhi - Kanpur)</option>
            <option value={2}>Corridor C2 (Ghaziabad - Aligarh)</option>
            <option value={3}>Corridor C3 (Aligarh - Tundla)</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering/Track">Engineering (Track)</option>
            <option value="S&T/Signalling">S&T (Signalling)</option>
            <option value="Traction Distribution">TRD (Traction)</option>
          </select>

          {/* Date Navigation */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 transition-colors border-r border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToday}
              className={`px-2.5 py-1.5 font-semibold text-[11px] hover:bg-slate-100 transition-colors ${currentDate === '2026-09-15' ? 'bg-amber-50 text-amber-800' : 'text-slate-700'}`}
            >
              Today (15 Sep)
            </button>
            <button
              onClick={handleNextDay}
              title="Next Day"
              className="px-2 py-1.5 hover:bg-slate-100 text-slate-600 transition-colors border-l border-slate-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${showHistory ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            title="Toggle previous plan versions (v1 replaced by v2)"
          >
            <History className="w-3.5 h-3.5 text-purple-700" />
            <span>{showHistory ? 'History Visible' : 'Show History'}</span>
          </button>
        </div>
      </div>

      {/* Conflict Alert Banner if detected */}
      {timeline?.conflicts && timeline.conflicts.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-rose-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              ⚠ TRAIN OVERLAP CONFLICT DETECTED: {timeline.conflicts[0].description}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
            {timeline.conflicts.length} Conflict(s)
          </span>
        </div>
      )}

      {/* Timeline Visual Canvas */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[950px] space-y-3">
          {/* Time Axis Header */}
          <div className="flex items-center pb-1 border-b border-slate-200 pl-40 text-[11px] font-semibold text-slate-500">
            <div className="relative w-full h-5">
              {hours.map((h, i) => (
                <span
                  key={i}
                  style={{ left: `${(i / (hours.length - 1)) * 100}%` }}
                  className="absolute -translate-x-1/2 select-none"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* ROW 1: TRAINS */}
          <div className="flex items-center">
            <div className="w-40 flex-shrink-0 pr-3 flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                <TrainIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">TRAINS</span>
                <span className="text-[10px] text-slate-400 font-medium">Passenger & Freight</span>
              </div>
            </div>

            <div className="flex-1 h-14 bg-slate-100/70 rounded-lg border border-slate-200 relative overflow-hidden flex items-center">
              {/* Hour vertical grid lines */}
              <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-40">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="border-r border-slate-300 h-full"></div>
                ))}
              </div>

              {/* Train items positioned by real minutes */}
              {timeline?.tracks?.trains?.map((tr: any) => (
                <div
                  key={tr.id}
                  onClick={() => setActiveModalItem(tr)}
                  style={{ left: calcLeft(tr.start_minute), width: calcWidth(tr.duration_minutes) }}
                  className={`absolute inset-y-2 rounded border px-2 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-slate-900 transition-all z-10 select-none ${tr.has_conflict ? 'bg-rose-700 text-white border-rose-900 ring-2 ring-rose-400' : 'bg-slate-800 text-white border-slate-900'}`}
                  title={`${tr.label} (${tr.start_time} - ${tr.end_time})`}
                >
                  <span className="text-[10px] font-bold truncate">
                    🚆 {tr.train_number}
                  </span>
                  <span className="text-[9px] font-mono opacity-80 pl-1 flex-shrink-0">
                    {tr.start_time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: MAINTENANCE TASKS */}
          <div className="flex items-center">
            <div className="w-40 flex-shrink-0 pr-3 flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">MAINTENANCE</span>
                <span className="text-[10px] text-slate-400 font-medium">Track, S&T & TRD</span>
              </div>
            </div>

            <div className="flex-1 h-16 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden flex items-center">
              {/* Hour vertical grid lines */}
              <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-40">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="border-r border-slate-300 h-full"></div>
                ))}
              </div>

              {timeline?.tracks?.maintenance?.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 italic">
                  No scheduled maintenance for this corridor/date.
                </div>
              ) : (
                timeline?.tracks?.maintenance?.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setActiveModalItem(m)
                      if (onSelectPlan && m.plan_id) onSelectPlan(m.plan_id)
                    }}
                    style={{ left: calcLeft(m.start_minute), width: calcWidth(m.duration_minutes) }}
                    className={`absolute inset-y-2 rounded border px-2 flex items-center justify-between cursor-pointer hover:ring-2 hover:ring-sky-500 transition-all z-20 select-none ${getMaintenanceColor(m)}`}
                    title={`${m.label} (${m.start_time} - ${m.end_time})`}
                  >
                    <div className="flex items-center space-x-1 truncate">
                      <span className="font-bold text-[10px] truncate">
                        {m.task_reference} {m.label}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/20 flex-shrink-0 ml-1">
                      {m.duration_minutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ROW 3: CORRIDOR POSSESSION BLOCKS */}
          <div className="flex items-center">
            <div className="w-40 flex-shrink-0 pr-3 flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-amber-500 text-slate-900 flex items-center justify-center flex-shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">BLOCKS</span>
                <span className="text-[10px] text-slate-400 font-medium">Possession Windows</span>
              </div>
            </div>

            <div className="flex-1 h-14 bg-amber-50/40 rounded-lg border border-amber-200 relative overflow-hidden flex items-center">
              {/* Hour vertical grid lines */}
              <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-40">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="border-r border-amber-300/60 h-full"></div>
                ))}
              </div>

              {timeline?.tracks?.blocks?.map((b: any) => (
                <div
                  key={b.id}
                  onClick={() => setActiveModalItem(b)}
                  style={{ left: calcLeft(b.start_minute), width: calcWidth(b.duration_minutes) }}
                  className="absolute inset-y-2 rounded border-2 border-amber-500 bg-amber-100/90 text-amber-950 px-2.5 flex items-center justify-between cursor-pointer hover:bg-amber-200 transition-all z-10 select-none shadow-xs"
                  title={`${b.label} (${b.start_time} - ${b.end_time})`}
                >
                  <span className="font-bold text-[11px] truncate">
                    🛡 {b.label}
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-white/80 px-1.5 py-0.5 rounded border border-amber-300 flex-shrink-0 ml-1">
                    {b.start_time}–{b.end_time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 inline-block"></span>
            <span className="text-slate-600 font-medium">Train Service</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-sky-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Planned Work</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Critical Maintenance</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Completed</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-300 border border-slate-400 inline-block"></span>
            <span className="text-slate-500 font-medium line-through">Replaced / Superseded</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 border border-amber-600 inline-block"></span>
            <span className="text-slate-700 font-medium">Possession Block</span>
          </div>
        </div>

        <span className="text-slate-400 font-mono text-[11px]">
          Live DB Data • {timeline?.total_tasks_scheduled || 0} Tasks Active
        </span>
      </div>

      {/* Interactive Detail Modal (Section 32) */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${activeModalItem.type === 'train' ? 'bg-slate-800 text-white' : (activeModalItem.type === 'block' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300')}`}>
                  {activeModalItem.type}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeModalItem.label || activeModalItem.id}
                </h4>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Train details */}
            {activeModalItem.type === 'train' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Train Number</span>
                  <span className="font-bold text-slate-800">{activeModalItem.train_number}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Type / Priority</span>
                  <span className="font-bold text-slate-800">{activeModalItem.train_type} ({activeModalItem.priority})</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Scheduled Window</span>
                  <span className="font-bold text-slate-800">{activeModalItem.start_time} – {activeModalItem.end_time}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Section</span>
                  <span className="font-bold text-slate-800">{activeModalItem.section_name}</span>
                </div>
              </div>
            )}

            {/* Maintenance details */}
            {activeModalItem.type === 'maintenance' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] font-semibold">Plan Number & Version</span>
                    <span className="font-bold text-slate-800">{activeModalItem.plan_number} (v{activeModalItem.plan_version})</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] font-semibold">Task Reference</span>
                    <span className="font-bold text-slate-800">{activeModalItem.task_reference}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] font-semibold">Department & Team</span>
                    <span className="font-bold text-slate-800">{activeModalItem.team}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] font-semibold">Status</span>
                    <span className={`font-bold ${activeModalItem.status === 'SUPERSEDED' ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                      {activeModalItem.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg col-span-2">
                    <span className="text-slate-400 block text-[10px] font-semibold">Possession Time Window</span>
                    <span className="font-bold text-slate-800">{activeModalItem.start_time} – {activeModalItem.end_time} ({activeModalItem.duration_minutes} minutes)</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Work Description</span>
                  <p className="font-medium text-slate-800">{activeModalItem.description}</p>
                </div>
              </div>
            )}

            {/* Block details */}
            {activeModalItem.type === 'block' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Block Type</span>
                  <span className="font-bold text-slate-800">{activeModalItem.block_type}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Section</span>
                  <span className="font-bold text-slate-800">{activeModalItem.section_name}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Window</span>
                  <span className="font-bold text-slate-800">{activeModalItem.start_time} – {activeModalItem.end_time}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px] font-semibold">Capacity Utilization</span>
                  <span className="font-bold text-amber-800">{activeModalItem.utilization || '89.4%'}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
