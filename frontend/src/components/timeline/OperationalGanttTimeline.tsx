import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Clock, AlertTriangle, AlertCircle, ChevronLeft, ChevronRight,
  Filter, Calendar, Eye, ZoomIn, ZoomOut, RefreshCw,
  Train as TrainIcon, Wrench, ShieldAlert, ArrowRight, X, ExternalLink
} from 'lucide-react'
import { fetchTimeline } from '../../services/api'
import { PriorityBadge, StatusBadge } from '../common/RailwayBadges'

export interface OperationalGanttTimelineProps {
  corridorId?: number
  selectedDate?: string
  trackFilter?: string
  onOpenReplan?: (conflictId?: string, taskRef?: string) => void
  readOnly?: boolean
  className?: string
}

export type ZoomHorizon = '2h' | '4h' | '8h' | '24h'

export const OperationalGanttTimeline: React.FC<OperationalGanttTimelineProps> = ({
  corridorId = 2,
  selectedDate = '2026-09-15',
  trackFilter,
  onOpenReplan,
  readOnly = false,
  className = ''
}) => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState<string>(selectedDate)
  const [zoom, setZoom] = useState<ZoomHorizon>('4h')
  const [windowStartHour, setWindowStartHour] = useState<number>(13) // 13:00 to 17:00 default for 4h
  const [selectedTrack, setSelectedTrack] = useState<string>(trackFilter || 'ALL')
  const [inspectorItem, setInspectorItem] = useState<any | null>(null)

  const { data: timelineData, isLoading, refetch } = useQuery({
    queryKey: ['operational-gantt', corridorId, currentDate],
    queryFn: () => fetchTimeline({ corridor_id: corridorId, date: currentDate }),
    refetchInterval: 30000
  })

  // Determine time window bounds in minutes of day
  const { startMin, endMin, totalSpanMin, timeMarkers } = useMemo(() => {
    let spanHours = 4
    if (zoom === '2h') spanHours = 2
    else if (zoom === '4h') spanHours = 4
    else if (zoom === '8h') spanHours = 8
    else if (zoom === '24h') spanHours = 24

    const sHour = zoom === '24h' ? 0 : Math.max(0, Math.min(24 - spanHours, windowStartHour))
    const sMin = sHour * 60
    const eMin = sMin + spanHours * 60

    // Generate interval marks
    const stepMin = zoom === '2h' ? 15 : zoom === '4h' ? 30 : zoom === '8h' ? 60 : 120
    const markers: { min: number; label: string; isHour: boolean }[] = []

    for (let m = sMin; m <= eMin; m += stepMin) {
      const h = Math.floor(m / 60)
      const minRemainder = m % 60
      const label = `${String(h).padStart(2, '0')}:${String(minRemainder).padStart(2, '0')}`
      markers.push({ min: m, label, isHour: minRemainder === 0 })
    }

    return {
      startMin: sMin,
      endMin: eMin,
      totalSpanMin: spanHours * 60,
      timeMarkers: markers
    }
  }, [zoom, windowStartHour])

  // Convert minutes of day to percentage within current zoom window
  const getPositionPercent = (minVal: number): number => {
    const clamped = Math.max(startMin, Math.min(endMin, minVal))
    return ((clamped - startMin) / totalSpanMin) * 100
  }

  const getWidthPercent = (startM: number, endM: number): number => {
    const visibleStart = Math.max(startMin, startM)
    const visibleEnd = Math.min(endMin, endM)
    if (visibleEnd <= visibleStart) return 0
    return ((visibleEnd - visibleStart) / totalSpanMin) * 100
  }

  // Group sections
  const sections = useMemo(() => {
    if (!timelineData) return []
    const secList = timelineData.sections || []
    if (secList.length > 0) {
      if (selectedTrack !== 'ALL') {
        return secList.filter((s: any) => s.code === selectedTrack || s.name === selectedTrack)
      }
      return secList
    }

    // Fallback if sections array is not provided
    const tracks = timelineData.tracks || {}
    const trains = tracks.trains || []
    const maint = tracks.maintenance || []
    const confs = timelineData.conflicts || []

    const trackKeys = ['C1', 'C2', 'C3']
    return trackKeys
      .filter((k) => selectedTrack === 'ALL' || selectedTrack === k)
      .map((k, idx) => {
        const secId = idx + 1
        const sTrains = trains.filter((t: any) => t.section_id === secId || t.section_name?.includes(k))
        const sMaint = maint.filter((m: any) => m.section_id === secId || m.section_name?.includes(k))
        const sConfs = confs.filter((c: any) => c.section_id === secId || c.track_name?.includes(k))
        return {
          section_id: secId,
          code: k,
          name: `Track ${k} (Mainline)`,
          trains: sTrains,
          maintenance: sMaint,
          conflicts: sConfs,
          has_conflict: sConfs.length > 0
        }
      })
  }, [timelineData, selectedTrack])

  const conflicts = timelineData?.conflicts || []

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800 text-sm">
            <Clock className="w-4 h-4 text-rail-maroon" />
            <span>Operational Timetable Timeline</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold font-mono text-[11px]">
            Corridor C{corridorId}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-medium">Date: {currentDate}</span>
        </div>

        {/* Controls: Zoom, Pan, Track filter */}
        <div className="flex items-center space-x-2">
          {/* Pan Navigation */}
          {zoom !== '24h' && (
            <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setWindowStartHour((h) => Math.max(0, h - 2))}
                className="px-2 py-1 text-slate-700 hover:bg-slate-100 transition-colors"
                title="Pan earlier"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 border-x border-slate-200">
                {String(windowStartHour).padStart(2, '0')}:00 – {String(windowStartHour + (zoom === '2h' ? 2 : zoom === '4h' ? 4 : 8)).padStart(2, '0')}:00
              </span>
              <button
                type="button"
                onClick={() => setWindowStartHour((h) => Math.min(20, h + 2))}
                className="px-2 py-1 text-slate-700 hover:bg-slate-100 transition-colors"
                title="Pan later"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Selector */}
          <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden text-[11px] shadow-2xs">
            {(['2h', '4h', '8h', '24h'] as ZoomHorizon[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                className={`px-2 py-1 font-semibold uppercase transition-colors ${
                  zoom === z ? 'bg-rail-maroon text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {z}
              </button>
            ))}
          </div>

          {/* Track Filter */}
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-[11px] bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-rail-maroon"
          >
            <option value="ALL">All Tracks (C1, C2, C3)</option>
            <option value="C1">Track C1 (Up Line)</option>
            <option value="C2">Track C2 (Down Line)</option>
            <option value="C3">Track C3 (Loop)</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
            title="Refresh timetable"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Conflict Alert Banner (Part 17) */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-300 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center space-x-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-xs bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded mr-2">
                  ⚠ CONFLICT DETECTED
                </span>
                <span className="text-xs font-semibold">
                  {conflicts[0].description || `Track ${conflicts[0].track_name || 'C2'} conflict between Maintenance and Train`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setInspectorItem(conflicts[0])}
                className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-white border border-amber-300 rounded hover:bg-amber-100 transition-colors"
              >
                [ VIEW CONFLICT ]
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenReplan) {
                      onOpenReplan(conflicts[0].id, conflicts[0].maintenance_label)
                    } else {
                      navigate('/manager/planner')
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-rail-maroon rounded hover:bg-rail-maroon-dark transition-colors shadow-2xs"
                >
                  [ AI REPLAN ]
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Operational Timeline / Gantt Canvas */}
      <div className="overflow-x-auto select-none">
        <div className="min-w-[760px] pb-4">
          {/* Continuous Time Axis Ruler */}
          <div className="flex border-b border-slate-300 bg-slate-100 text-[11px] font-mono text-slate-600 sticky top-0 z-10">
            {/* Left track column header */}
            <div className="w-36 shrink-0 px-3 py-2 font-bold text-slate-800 border-r border-slate-300 uppercase tracking-wider text-[10px] bg-slate-200 flex items-center">
              Track / Section
            </div>

            {/* Time ruler segments */}
            <div className="relative flex-1 h-9">
              {timeMarkers.map((marker, idx) => {
                const leftPct = getPositionPercent(marker.min)
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 flex flex-col justify-between border-l border-slate-300 pl-1"
                    style={{ left: `${leftPct}%` }}
                  >
                    <span className={`text-[10px] pt-1 font-semibold ${marker.isHour ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                      {marker.label}
                    </span>
                    <div className={`w-px ${marker.isHour ? 'h-2 bg-slate-400' : 'h-1 bg-slate-300'}`} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Track Rows (C1, C2, C3, etc.) */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading timetable timeline...</div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No tracks or timetable items for selected date.</div>
          ) : (
            sections.map((sec: any) => {
              return (
                <div
                  key={sec.code}
                  className={`flex border-b border-slate-200 transition-colors ${
                    sec.has_conflict ? 'bg-amber-50/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Vertical Axis: Track Label */}
                  <div className="w-36 shrink-0 px-3 py-4 border-r border-slate-300 bg-slate-50 flex flex-col justify-center">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">{sec.code}</span>
                      {sec.has_conflict && (
                        <span className="inline-flex items-center text-[10px] text-red-700 bg-red-100 border border-red-300 px-1 rounded font-bold">
                          ⚠ CONFLICT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">{sec.name}</span>
                  </div>

                  {/* Horizontal Timeline Track */}
                  <div className="relative flex-1 h-20 bg-white border-b border-slate-100">
                    {/* Time Grid Vertical Guides */}
                    {timeMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 w-px ${marker.isHour ? 'bg-slate-200' : 'bg-slate-100'}`}
                        style={{ left: `${getPositionPercent(marker.min)}%` }}
                      />
                    ))}

                    {/* Central Track Baseline Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300 -translate-y-1/2 pointer-events-none" />

                    {/* 1. Train Movements on this track row */}
                    {sec.trains?.map((tr: any) => {
                      const left = getPositionPercent(tr.start_minute)
                      const width = getWidthPercent(tr.start_minute, tr.end_minute)
                      if (width <= 0) return null

                      return (
                        <div
                          key={tr.id}
                          onClick={() => setInspectorItem(tr)}
                          className={`absolute top-2 h-7 rounded px-2 flex items-center space-x-1 cursor-pointer transition-all shadow-2xs text-[11px] font-bold border truncate ${
                            tr.has_conflict
                              ? 'bg-rose-800 text-white border-rose-950 ring-2 ring-red-500'
                              : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-900'
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 4.5)}%`,
                            zIndex: 4
                          }}
                          title={`Train ${tr.train_number} | ${tr.start_time}–${tr.end_time} | Click for details`}
                        >
                          <TrainIcon className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate">{tr.train_number}</span>
                          <span className="text-[9px] opacity-80 hidden sm:inline font-mono">({tr.start_time})</span>
                        </div>
                      )
                    })}

                    {/* 2. Maintenance Work Blocks on this track row */}
                    {sec.maintenance?.map((m: any) => {
                      const left = getPositionPercent(m.start_minute)
                      const width = getWidthPercent(m.start_minute, m.end_minute)
                      if (width <= 0) return null

                      const isSuperseded = m.is_superseded || m.status === 'SUPERSEDED'

                      return (
                        <div
                          key={m.id}
                          onClick={() => setInspectorItem(m)}
                          className={`absolute bottom-2 h-7 rounded px-2 flex items-center space-x-1 cursor-pointer transition-all shadow-2xs text-[11px] font-bold border truncate ${
                            isSuperseded
                              ? 'bg-slate-200 text-slate-500 border-dashed border-slate-400 line-through opacity-60'
                              : m.has_conflict
                              ? 'bg-amber-600 text-white border-amber-800 ring-2 ring-amber-400'
                              : 'bg-rail-maroon text-white border-rail-maroon-dark hover:bg-rail-maroon-dark'
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 5.0)}%`,
                            zIndex: 5
                          }}
                          title={`Maintenance ${m.task_reference || m.label} | ${m.start_time}–${m.end_time} | Click for details`}
                        >
                          <Wrench className="w-3 h-3 text-amber-200 shrink-0" />
                          <span className="truncate">{m.task_reference || 'WO-1024'}</span>
                          <span className="text-[9px] opacity-80 hidden sm:inline font-mono">({m.start_time}–{m.end_time})</span>
                        </div>
                      )
                    })}

                    {/* 3. Conflict Hatched Markers */}
                    {sec.conflicts?.map((conf: any, cIdx: number) => {
                      // Visual conflict indicator on track
                      return (
                        <div
                          key={cIdx}
                          onClick={() => setInspectorItem(conf)}
                          className="absolute inset-y-1 bg-red-500/20 border-x-2 border-red-600 rounded flex items-center justify-center cursor-pointer pointer-events-auto"
                          style={{
                            left: `${getPositionPercent(14 * 60 + 30)}%`,
                            width: '4.5%',
                            zIndex: 6
                          }}
                          title="Click conflict alert"
                        >
                          <span className="text-[10px] font-black text-red-700 bg-white/90 px-1 rounded shadow-2xs border border-red-300">
                            ⚠ OVERLAP
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 4. Legend & Summary Footer */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-800">Legend:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-900" />
            <span className="text-[11px]">Scheduled Train Path</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-rail-maroon border border-rail-maroon-dark" />
            <span className="text-[11px]">Maintenance Work Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600" />
            <span className="text-[11px]">Timetable Conflict</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 border border-dashed border-slate-400 line-through" />
            <span className="text-[11px]">Superseded Plan</span>
          </div>
        </div>

        <div className="text-[11px] font-medium text-slate-500">
          Showing {sections.length} tracks • {conflicts.length} conflict(s) detected
        </div>
      </div>

      {/* 5. Inspector Detail Modal / Drawer */}
      {inspectorItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                {inspectorItem.type === 'train' ? (
                  <TrainIcon className="w-5 h-5 text-slate-800" />
                ) : (
                  <Wrench className="w-5 h-5 text-rail-maroon" />
                )}
                <h4 className="font-bold text-base text-slate-900">
                  {inspectorItem.train_number
                    ? `Train ${inspectorItem.train_number}`
                    : inspectorItem.task_reference || inspectorItem.label || 'Timetable Item Details'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectorItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Scheduled Time:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {inspectorItem.start_time} – {inspectorItem.end_time}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Track / Section:</span>
                  <span className="font-bold text-slate-900">
                    {inspectorItem.section_name || inspectorItem.track_name || 'Section C2'}
                  </span>
                </div>
              </div>

              {inspectorItem.description && (
                <div>
                  <span className="text-slate-500 block font-semibold mb-0.5">Description / Issue:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    {inspectorItem.description}
                  </p>
                </div>
              )}

              {inspectorItem.department && (
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">{inspectorItem.department}</span>
                </div>
              )}

              {inspectorItem.status && (
                <div className="flex justify-between items-center border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Operational Status:</span>
                  <StatusBadge status={inspectorItem.status} />
                </div>
              )}

              {inspectorItem.priority_level && (
                <div className="flex justify-between items-center border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Priority Level:</span>
                  <PriorityBadge level={inspectorItem.priority_level} />
                </div>
              )}

              {inspectorItem.reasons && (
                <div>
                  <span className="text-slate-500 block font-semibold mb-1">Explainable Priority Reasons:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 bg-slate-50 p-2 rounded">
                    {inspectorItem.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setInspectorItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded hover:bg-slate-200"
              >
                Close
              </button>
              {inspectorItem.can_replan && !readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setInspectorItem(null)
                    if (onOpenReplan) onOpenReplan(inspectorItem.id)
                    else navigate('/manager/planner')
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rail-maroon rounded hover:bg-rail-maroon-dark"
                >
                  Open AI Planner
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
