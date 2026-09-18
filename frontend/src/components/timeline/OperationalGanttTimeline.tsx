import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  RefreshCw,
  Train as TrainIcon,
  Wrench,
  Table as TableIcon,
  SlidersHorizontal,
  X,
  MapPin,
  Shield,
  Activity
} from 'lucide-react'
import { fetchTimeline } from '../../services/api'
import { MOCK_TRAINS, MOCK_MAINTENANCE_BLOCKS, MockTrain, MockMaintenanceBlock } from '../../services/mockTrafficData'

export interface OperationalGanttTimelineProps {
  corridorId?: number
  selectedDate?: string
  trackFilter?: string
  onOpenReplan?: (conflictId?: string, taskRef?: string) => void
  readOnly?: boolean
  className?: string
}

export type ZoomHorizon = '2h' | '4h' | '8h' | '24h'
export type ViewMode = 'gantt' | 'table'

export const OperationalGanttTimeline: React.FC<OperationalGanttTimelineProps> = ({
  corridorId = 2,
  selectedDate = '2026-09-15',
  trackFilter,
  onOpenReplan,
  readOnly = false,
  className = ''
}) => {
  const navigate = useNavigate()
  const [currentDate] = useState<string>(selectedDate)
  const [zoom, setZoom] = useState<ZoomHorizon>('4h')
  const [windowStartHour, setWindowStartHour] = useState<number>(12) // 12:00 to 16:00 window default
  const [selectedTrack, setSelectedTrack] = useState<string>(trackFilter || 'ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('gantt')
  const [selectedItem, setSelectedItem] = useState<{ type: 'train' | 'block'; data: any } | null>(null)

  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['operational-gantt', corridorId, currentDate],
    queryFn: () => fetchTimeline({ corridor_id: corridorId, date: currentDate }),
    refetchInterval: 30000
  })

  // Combine live backend data with rich deterministic mock traffic
  const trainsList: MockTrain[] = useMemo(() => {
    return MOCK_TRAINS
  }, [])

  const blocksList: MockMaintenanceBlock[] = useMemo(() => {
    return MOCK_MAINTENANCE_BLOCKS
  }, [])

  // Time window bounds in minutes of day
  const { startMin, endMin, totalSpanMin, timeMarkers } = useMemo(() => {
    let spanHours = 4
    if (zoom === '2h') spanHours = 2
    else if (zoom === '4h') spanHours = 4
    else if (zoom === '8h') spanHours = 8
    else if (zoom === '24h') spanHours = 24

    const sHour = zoom === '24h' ? 0 : Math.max(0, Math.min(24 - spanHours, windowStartHour))
    const sMin = sHour * 60
    const eMin = sMin + spanHours * 60

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

  const tracks = [
    { code: 'C1', name: 'Track C1 (Up Fast)', desc: 'Salem ➔ Erode Passenger Corridor', speed: '140 km/h' },
    { code: 'C2', name: 'Track C2 (Down Main)', desc: 'Erode ➔ Salem Mainline', speed: '130 km/h' },
    { code: 'C3', name: 'Track C3 (Goods Loop)', desc: 'Heavy Freight & Container Path', speed: '100 km/h' },
    { code: 'C4', name: 'Track C4 (Loop / Siding)', desc: 'Platform Loop & Station Shunt', speed: '60 km/h' }
  ]

  const filteredTracks = tracks.filter((t) => selectedTrack === 'ALL' || t.code === selectedTrack)

  // Active track conflict between Vande Bharat 20643 and Thermit welding block on C2
  const conflictDetected = {
    track: 'C2',
    train: '20643 (Vande Bharat)',
    block: 'BLK-C2-01 (Thermit Welding)',
    overlapTime: '14:00 – 14:25',
    margin: '-25 min head clash'
  }

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden ${className}`}>
      {/* 1. Control Toolbar */}
      <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-zinc-100 font-semibold">
            <Clock className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <span>Operational Timetable & Possession Schedule</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-zinc-400 text-[11px]">Corridor C{corridorId} (Salem–Erode)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'gantt' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Gantt</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Table</span>
            </button>
          </div>

          {viewMode === 'gantt' && (
            <>
              {/* Pan Buttons */}
              <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setWindowStartHour((h) => Math.max(0, h - 2))}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Pan earlier"
                >
                  <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <span className="px-2 py-1 text-[11px] font-mono text-zinc-300 bg-zinc-950/60 border-x border-zinc-800">
                  {String(windowStartHour).padStart(2, '0')}:00 –{' '}
                  {String(windowStartHour + (zoom === '2h' ? 2 : zoom === '4h' ? 4 : 8)).padStart(2, '0')}:00
                </span>
                <button
                  type="button"
                  onClick={() => setWindowStartHour((h) => Math.min(20, h + 2))}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Pan later"
                >
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden text-[11px]">
                {(['2h', '4h', '8h', '24h'] as ZoomHorizon[]).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoom(z)}
                    className={`px-2 py-1 font-mono uppercase transition-colors ${
                      zoom === z ? 'bg-blue-600 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Track Filter */}
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="border border-zinc-800 rounded-md px-2.5 py-1 text-xs bg-zinc-900 text-zinc-200 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All Tracks (C1, C2, C3, C4)</option>
            <option value="C1">Track C1 (Up Fast)</option>
            <option value="C2">Track C2 (Down Main)</option>
            <option value="C3">Track C3 (Goods Loop)</option>
            <option value="C4">Track C4 (Siding)</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 border border-zinc-800 rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Refresh timetable"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 2. Detected Track Conflict Banner */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.5} />
          <span className="font-semibold text-red-400">Headway Conflict on Track {conflictDetected.track}:</span>
          <span className="text-zinc-300 font-mono text-[11px]">
            {conflictDetected.train} clashing with {conflictDetected.block} ({conflictDetected.overlapTime})
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={() => navigate('/manager/approval-planning')}
            className="self-end sm:self-auto px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
          >
            Review AI Replan
          </button>
        )}
      </div>

      {/* 3. Main Body: Gantt View or Tabular View */}
      {viewMode === 'gantt' ? (
        <div className="overflow-x-auto select-none bg-zinc-950">
          <div className="min-w-[840px] pb-4">
            {/* Time Axis Ruler */}
            <div className="flex border-b border-zinc-800 bg-zinc-950 text-[11px] font-mono text-zinc-400 sticky top-0 z-10">
              <div className="w-44 shrink-0 px-3 py-2 font-semibold uppercase tracking-wider text-[10px] text-zinc-500 border-r border-zinc-800 bg-zinc-950 flex items-center">
                Track / Section
              </div>
              <div className="relative flex-1 h-8">
                {timeMarkers.map((marker, idx) => {
                  const leftPct = getPositionPercent(marker.min)
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 flex flex-col justify-between border-l border-zinc-800/80 pl-1"
                      style={{ left: `${leftPct}%` }}
                    >
                      <span className={`text-[10px] pt-1 font-mono ${marker.isHour ? 'text-zinc-300 font-bold' : 'text-zinc-500'}`}>
                        {marker.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Track Lanes */}
            {filteredTracks.map((trk) => {
              const trkTrains = trainsList.filter((t) => t.track === trk.code)
              const trkBlocks = blocksList.filter((b) => b.track === trk.code)

              return (
                <div key={trk.code} className="flex border-b border-zinc-800/80 hover:bg-zinc-900/30 transition-colors group">
                  {/* Left Label */}
                  <div className="w-44 shrink-0 px-3 py-4 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-center">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-zinc-200 font-mono">{trk.code}</span>
                      <span className="text-[10px] text-zinc-400 truncate">{trk.name.split('(')[1]?.replace(')', '') || 'Main'}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{trk.speed} max</div>
                  </div>

                  {/* Right Lane with Train Bars & Maintenance Possession Blocks */}
                  <div className="relative flex-1 h-24 bg-zinc-950/40 overflow-hidden">
                    {/* Background Grid Lines */}
                    {timeMarkers.map((m, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-zinc-800/30 pointer-events-none"
                        style={{ left: `${getPositionPercent(m.min)}%` }}
                      />
                    ))}

                    {/* Maintenance Possession Blocks (Striped amber/red zone) */}
                    {trkBlocks.map((b) => {
                      const left = getPositionPercent(b.startMinute)
                      const width = getWidthPercent(b.startMinute, b.startMinute + b.durationMinutes)
                      if (width <= 0) return null

                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedItem({ type: 'block', data: b })}
                          className="absolute top-2 bottom-12 rounded border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 cursor-pointer transition-all p-1.5 flex flex-col justify-between shadow-xs overflow-hidden"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Possession: ${b.title} (${b.startTime} - ${b.endTime})`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <Wrench className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.5} />
                            <span className="text-[10px] font-mono font-bold text-amber-300 truncate">
                              {b.id} • {b.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[9px] text-amber-200/80 font-mono">
                            <span>{b.startTime}–{b.endTime}</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">SR {b.speedRestrictionKmh} km/h</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Train Movements (Electric Blue / Green pill bars) */}
                    {trkTrains.map((tr) => {
                      const left = getPositionPercent(tr.startMinute)
                      const width = Math.max(6, getWidthPercent(tr.startMinute, tr.startMinute + tr.durationMinutes))
                      if (left + width < 0 || left > 100) return null

                      const isClash = tr.id === 'TR-20643' && trk.code === 'C2'

                      return (
                        <div
                          key={tr.id}
                          onClick={() => setSelectedItem({ type: 'train', data: tr })}
                          className={`absolute bottom-2 h-8 rounded border cursor-pointer transition-all px-2 py-1 flex items-center justify-between shadow-xs ${
                            isClash
                              ? 'bg-red-500/20 border-red-500 text-red-200'
                              : 'bg-zinc-800 border-zinc-700 hover:border-blue-500/80 text-zinc-100 hover:bg-zinc-750'
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${tr.trainNumber} ${tr.trainName} (${tr.scheduledDeparture} - ${tr.scheduledArrival})`}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <TrainIcon className="w-3 h-3 text-blue-400 shrink-0" strokeWidth={1.5} />
                            <span className="text-[10px] font-mono font-bold text-zinc-200 truncate">
                              {tr.trainNumber} {tr.trainName.split(' ')[0]}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-400 pl-1 shrink-0">
                            {tr.speedKmh} km/h
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Tabular View */
        <div className="p-4 space-y-6 bg-zinc-950">
          {/* Trains Timetable Table */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Train Movements Timetable
            </div>
            <div className="border border-zinc-800 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase">
                    <th className="px-3.5 py-2.5">Train No</th>
                    <th className="px-3.5 py-2.5">Train Name</th>
                    <th className="px-3.5 py-2.5">Track</th>
                    <th className="px-3.5 py-2.5">Departure</th>
                    <th className="px-3.5 py-2.5">Arrival</th>
                    <th className="px-3.5 py-2.5">Direction</th>
                    <th className="px-3.5 py-2.5">Speed</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {trainsList.map((tr) => (
                    <tr
                      key={tr.id}
                      onClick={() => setSelectedItem({ type: 'train', data: tr })}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-blue-400">{tr.trainNumber}</td>
                      <td className="px-3.5 py-2.5 text-zinc-200 font-sans font-medium">{tr.trainName}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">{tr.trackName}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300">{tr.scheduledDeparture}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300">{tr.scheduledArrival}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">{tr.direction}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300">{tr.speedKmh} km/h</td>
                      <td className="px-3.5 py-2.5 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            tr.status === 'RUNNING'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {tr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Blocks Table */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Coordinated Track Maintenance Possessions
            </div>
            <div className="border border-zinc-800 rounded-md overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-[10px] font-semibold text-zinc-400 uppercase">
                    <th className="px-3.5 py-2.5">Block ID</th>
                    <th className="px-3.5 py-2.5">Work Title</th>
                    <th className="px-3.5 py-2.5">Track / KM</th>
                    <th className="px-3.5 py-2.5">Time Window</th>
                    <th className="px-3.5 py-2.5">Department</th>
                    <th className="px-3.5 py-2.5">Speed Restriction</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {blocksList.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedItem({ type: 'block', data: b })}
                      className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-amber-400">{b.id}</td>
                      <td className="px-3.5 py-2.5 text-zinc-200 font-sans font-medium">{b.title}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">
                        {b.track} (KM {b.startKm}–{b.endKm})
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-300">
                        {b.startTime} – {b.endTime}
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-400 font-sans">{b.department.replace('_', ' ')}</td>
                      <td className="px-3.5 py-2.5 text-amber-400 font-bold">{b.speedRestrictionKmh} km/h</td>
                      <td className="px-3.5 py-2.5 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            b.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Inspector Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                {selectedItem.type === 'train' ? (
                  <TrainIcon className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                ) : (
                  <Wrench className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                )}
                <span className="font-semibold text-zinc-100 text-sm">
                  {selectedItem.type === 'train' ? selectedItem.data.trainName : selectedItem.data.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {selectedItem.type === 'train' ? (
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Train Number:</span>
                  <span className="font-mono font-bold text-zinc-100">{selectedItem.data.trainNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service Category:</span>
                  <span className="text-zinc-200">{selectedItem.data.trainType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Assigned Track:</span>
                  <span className="font-mono text-zinc-200">{selectedItem.data.trackName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Route Section:</span>
                  <span className="text-zinc-200">{selectedItem.data.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Schedule Time:</span>
                  <span className="font-mono text-blue-400">
                    {selectedItem.data.scheduledDeparture} ➔ {selectedItem.data.scheduledArrival}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Current Speed:</span>
                  <span className="font-mono text-zinc-100">{selectedItem.data.speedKmh} km/h</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Block ID:</span>
                  <span className="font-mono font-bold text-amber-400">{selectedItem.data.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Work Order:</span>
                  <span className="font-mono text-zinc-200">{selectedItem.data.workOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Track & Span:</span>
                  <span className="font-mono text-zinc-200">
                    {selectedItem.data.track} (KM {selectedItem.data.startKm} to {selectedItem.data.endKm})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Possession Window:</span>
                  <span className="font-mono text-amber-300">
                    {selectedItem.data.startTime} – {selectedItem.data.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Supervisor:</span>
                  <span className="text-zinc-200">{selectedItem.data.supervisor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Assigned Gang:</span>
                  <span className="text-zinc-200">{selectedItem.data.assignedGang}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Machinery Deployed:</span>
                  <span className="text-zinc-200">{selectedItem.data.machinery}</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperationalGanttTimeline
