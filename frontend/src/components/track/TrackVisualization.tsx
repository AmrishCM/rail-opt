import React, { useState } from 'react'
import {
  AlertTriangle,
  Train as TrainIcon,
  Wrench,
  MapPin,
  Clock,
  Shield,
  Filter,
  Eye,
  Activity,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { MOCK_TRAINS, MOCK_MAINTENANCE_BLOCKS, MockTrain, MockMaintenanceBlock } from '../../services/mockTrafficData'

interface TrackIssuePin {
  id: string
  track: string
  km: number
  defectType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  status: string
  department: string
}

const DEFAULT_ISSUES: TrackIssuePin[] = [
  {
    id: 'RO-2026-00101',
    track: 'C2',
    km: 42.8,
    defectType: 'Rail Fracture at Weld Joint',
    severity: 'CRITICAL',
    status: 'In Progress (Welding)',
    department: 'Civil Engineering / P-Way'
  },
  {
    id: 'RO-2026-00102',
    track: 'C1',
    km: 18.5,
    defectType: 'Point Machine PM-042 Switch Obstruction',
    severity: 'HIGH',
    status: 'Completed & Locked',
    department: 'S&T / Signalling'
  },
  {
    id: 'RO-2026-00103',
    track: 'C2',
    km: 58.0,
    defectType: '25kV Cantilever Insulator Soot Flashover',
    severity: 'HIGH',
    status: 'Power Block Scheduled',
    department: 'Traction Distribution'
  },
  {
    id: 'RO-2026-00104',
    track: 'C3',
    km: 74.2,
    defectType: 'CMS Crossing Nose Chipping',
    severity: 'MEDIUM',
    status: 'Inspection Scheduled',
    department: 'Civil Engineering / P-Way'
  }
]

export const TrackVisualization: React.FC<{
  selectedIssueId?: string
  onSelectIssue?: (id: string) => void
  compact?: boolean
}> = ({ selectedIssueId, onSelectIssue, compact = false }) => {
  const [activePin, setActivePin] = useState<TrackIssuePin | null>(
    DEFAULT_ISSUES.find((i) => i.id === selectedIssueId) || DEFAULT_ISSUES[0]
  )
  const [selectedTrain, setSelectedTrain] = useState<MockTrain | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<MockMaintenanceBlock | null>(null)
  const [layerFilter, setLayerFilter] = useState<'ALL' | 'TRAINS' | 'BLOCKS' | 'DEFECTS'>('ALL')

  const tracks = [
    { code: 'C1', name: 'Track C1 — Up Fast (Passenger Express)', maxSpeed: '140 km/h' },
    { code: 'C2', name: 'Track C2 — Down Main (Corridor Mainline)', maxSpeed: '130 km/h' },
    { code: 'C3', name: 'Track C3 — Goods Loop / Freight Corridor', maxSpeed: '100 km/h' },
    { code: 'C4', name: 'Track C4 — Station Siding / Loop Track', maxSpeed: '60 km/h' }
  ]

  const kmMarkers = [0, 15, 30, 45, 60, 75, 90, 100]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
      {/* Header & Section Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SIMULATED TRACK SCHEMATIC
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Corridor C2 • Salem Jn (KM 0) ➔ Sankari Durg ➔ Erode Jn (KM 100)
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time train positioning, active speed restrictions, maintenance possession zones, and defect telemetry
          </p>
        </div>

        {/* Layer Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-md p-1 text-[11px]">
          {(['ALL', 'TRAINS', 'BLOCKS', 'DEFECTS'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setLayerFilter(filter)}
              className={`px-2.5 py-0.5 rounded font-mono font-medium transition-colors ${
                layerFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Schematic Canvas */}
      <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 overflow-x-auto select-none">
        <div className="min-w-[800px] space-y-6 py-2">
          {/* KM Header Scale with Stations */}
          <div className="relative h-7 border-b border-zinc-800/80 flex justify-between text-[10px] font-mono text-zinc-400 px-2">
            {kmMarkers.map((km) => (
              <div key={km} className="flex flex-col items-center">
                <span className="font-semibold text-zinc-300">KM {km}</span>
                <div className="w-px h-2 bg-zinc-700 mt-0.5" />
              </div>
            ))}
          </div>

          {/* 4 Track Rails */}
          <div className="space-y-6">
            {tracks.map((trk) => {
              const trkIssues = DEFAULT_ISSUES.filter((i) => i.track === trk.code)
              const trkBlocks = MOCK_MAINTENANCE_BLOCKS.filter((b) => b.track === trk.code)
              const trkTrains = MOCK_TRAINS.filter((t) => t.track === trk.code)

              return (
                <div key={trk.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-zinc-200">
                      {trk.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Permissible: {trk.maxSpeed}
                    </span>
                  </div>

                  {/* The Track Rail Line */}
                  <div className="relative h-11 bg-zinc-900/90 rounded-md border border-zinc-800 flex items-center px-2">
                    {/* Continuous Twin Steel Rails */}
                    <div className="absolute inset-x-0 top-3.5 h-[2px] bg-zinc-700" />
                    <div className="absolute inset-x-0 bottom-3.5 h-[2px] bg-zinc-700" />

                    {/* Sleepers Pattern */}
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, #71717a 0px, #71717a 2px, transparent 2px, transparent 14px)'
                      }}
                    />

                    {/* Maintenance Possession Blocks */}
                    {(layerFilter === 'ALL' || layerFilter === 'BLOCKS') &&
                      trkBlocks.map((blk) => (
                        <div
                          key={blk.id}
                          onClick={() => setSelectedBlock(blk)}
                          className="absolute h-full bg-amber-500/15 hover:bg-amber-500/25 border-x-2 border-amber-500 flex items-center justify-between px-2 text-[10px] font-mono text-amber-300 z-10 cursor-pointer transition-colors shadow-xs"
                          style={{
                            left: `${blk.startKm}%`,
                            width: `${Math.max(12, blk.endKm - blk.startKm + 8)}%`
                          }}
                          title={`Possession: ${blk.title} (${blk.startTime}–${blk.endTime})`}
                        >
                          <div className="flex items-center space-x-1 truncate">
                            <Wrench className="w-3 h-3 text-amber-400 shrink-0" strokeWidth={1.5} />
                            <span className="font-bold truncate">{blk.id}</span>
                          </div>
                          <span className="px-1 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] shrink-0">
                            SR {blk.speedRestrictionKmh} km/h
                          </span>
                        </div>
                      ))}

                    {/* Live Moving Trains on Track */}
                    {(layerFilter === 'ALL' || layerFilter === 'TRAINS') &&
                      trkTrains.map((tr) => (
                        <div
                          key={tr.id}
                          onClick={() => setSelectedTrain(tr)}
                          className="absolute z-20 -translate-x-1/2 cursor-pointer group"
                          style={{ left: `${tr.currentKm}%` }}
                          title={`${tr.trainNumber} ${tr.trainName} (${tr.speedKmh} km/h)`}
                        >
                          <div className="flex items-center space-x-1 bg-zinc-950 border border-blue-500/80 hover:border-blue-400 text-zinc-100 px-2 py-0.5 rounded shadow-lg transition-transform group-hover:scale-105">
                            <TrainIcon className="w-3 h-3 text-blue-400 shrink-0" strokeWidth={1.5} />
                            <span className="font-mono font-bold text-[10px] text-zinc-100">{tr.trainNumber}</span>
                            {tr.direction === 'UP' ? (
                              <ArrowRight className="w-3 h-3 text-blue-400" strokeWidth={2} />
                            ) : (
                              <ArrowLeft className="w-3 h-3 text-blue-400" strokeWidth={2} />
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-400 text-center mt-0.5">
                            {tr.speedKmh} km/h
                          </div>
                        </div>
                      ))}

                    {/* Defect Pins along KM */}
                    {(layerFilter === 'ALL' || layerFilter === 'DEFECTS') &&
                      trkIssues.map((iss) => {
                        const isSelected = activePin?.id === iss.id
                        return (
                          <button
                            key={iss.id}
                            type="button"
                            onClick={() => {
                              setActivePin(iss)
                              if (onSelectIssue) onSelectIssue(iss.id)
                            }}
                            className={`absolute z-30 -top-2 -translate-x-1/2 flex flex-col items-center group transition-transform ${
                              isSelected ? 'scale-125' : 'hover:scale-110'
                            }`}
                            style={{ left: `${iss.km}%` }}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md border ${
                                iss.severity === 'CRITICAL'
                                  ? 'bg-red-600 border-red-400 ring-2 ring-red-500/30'
                                  : iss.severity === 'HIGH'
                                  ? 'bg-amber-600 border-amber-400'
                                  : 'bg-blue-600 border-blue-400'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
                            </div>
                            <span className="text-[9px] font-mono text-zinc-300 bg-zinc-900 px-1 rounded border border-zinc-700 mt-0.5">
                              KM {iss.km}
                            </span>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail Inspector Card (Pin, Train, or Work Block) */}
      {activePin && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-zinc-100">{activePin.id}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                  activePin.severity === 'CRITICAL'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {activePin.severity}
              </span>
              <span className="text-zinc-400 font-mono">Track {activePin.track} • KM {activePin.km}</span>
            </div>
            <span className="text-zinc-400">{activePin.department}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Defect Diagnosis</div>
              <div className="text-zinc-200 font-medium mt-0.5">{activePin.defectType}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Possession Status</div>
              <div className="text-zinc-200 font-medium mt-0.5">{activePin.status}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Recommended Window</div>
              <div className="text-amber-400 font-mono font-medium mt-0.5">14:00 – 16:30 (150 min block)</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Train Drawer Modal */}
      {selectedTrain && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 max-w-sm w-full shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <TrainIcon className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                <span className="font-bold text-zinc-100">{selectedTrain.trainNumber} {selectedTrain.trainName}</span>
              </div>
              <button onClick={() => setSelectedTrain(null)} className="text-zinc-400 hover:text-zinc-200">✕</button>
            </div>
            <div className="space-y-1.5 text-zinc-300">
              <div className="flex justify-between"><span className="text-zinc-500">Track:</span><span className="font-mono">{selectedTrain.trackName}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Speed:</span><span className="font-mono text-zinc-100">{selectedTrain.speedKmh} km/h</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Current Position:</span><span className="font-mono">KM {selectedTrain.currentKm}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Route:</span><span>{selectedTrain.route}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Schedule:</span><span className="font-mono text-blue-400">{selectedTrain.scheduledDeparture} ➔ {selectedTrain.scheduledArrival}</span></div>
            </div>
            <div className="pt-2 border-t border-zinc-800 text-right">
              <button onClick={() => setSelectedTrain(null)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Block Drawer Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 max-w-sm w-full shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                <span className="font-bold text-zinc-100">{selectedBlock.id} • {selectedBlock.title}</span>
              </div>
              <button onClick={() => setSelectedBlock(null)} className="text-zinc-400 hover:text-zinc-200">✕</button>
            </div>
            <div className="space-y-1.5 text-zinc-300">
              <div className="flex justify-between"><span className="text-zinc-500">Work Order:</span><span className="font-mono">{selectedBlock.workOrderId}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Track:</span><span className="font-mono">{selectedBlock.track} (KM {selectedBlock.startKm}–{selectedBlock.endKm})</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Window:</span><span className="font-mono text-amber-400">{selectedBlock.startTime} – {selectedBlock.endTime}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Speed Restriction:</span><span className="font-mono text-amber-300 font-bold">{selectedBlock.speedRestrictionKmh} km/h</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Gang / Machinery:</span><span>{selectedBlock.assignedGang}</span></div>
            </div>
            <div className="pt-2 border-t border-zinc-800 text-right">
              <button onClick={() => setSelectedBlock(null)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackVisualization
