import React, { useState } from 'react'
import {
  AlertTriangle,
  Train,
  Wrench,
  Zap,
  Radio,
  MapPin,
  ChevronRight,
  Shield,
  Layers,
  Info
} from 'lucide-react'

interface TrackIssuePin {
  id: string
  track: string
  km: number
  defectType: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  status: string
  department: string
}

interface TrackBlockZone {
  track: string
  startKm: number
  endKm: number
  window: string
  status: string
}

const DEFAULT_ISSUES: TrackIssuePin[] = [
  {
    id: 'RO-2026-00101',
    track: 'C2',
    km: 42.8,
    defectType: 'Rail Fracture at Weld Joint',
    severity: 'CRITICAL',
    status: 'MANAGER_REVIEW',
    department: 'Engineering/Track'
  },
  {
    id: 'RO-2026-00102',
    track: 'C2',
    km: 44.2,
    defectType: 'Point Machine High Throw Resistance',
    severity: 'HIGH',
    status: 'PLAN_READY',
    department: 'S&T/Signalling'
  },
  {
    id: 'RO-2026-00103',
    track: 'C2',
    km: 45.0,
    defectType: '25kV Cantilever Insulator Soot Flashover',
    severity: 'HIGH',
    status: 'APPROVED',
    department: 'Traction Distribution'
  },
  {
    id: 'RO-2026-00104',
    track: 'C3',
    km: 68.4,
    defectType: 'CMS Crossing Chipping',
    severity: 'MEDIUM',
    status: 'REPORTED',
    department: 'Engineering/Track'
  }
]

const DEFAULT_BLOCKS: TrackBlockZone[] = [
  {
    track: 'C2',
    startKm: 40.0,
    endKm: 48.0,
    window: '14:00 – 16:30',
    status: 'PLANNED'
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

  const tracks = [
    { code: 'C1', name: 'Track C1 — Up Fast (Passenger Express)', maxSpeed: '140 km/h' },
    { code: 'C2', name: 'Track C2 — Down Line (Corridor Main)', maxSpeed: '130 km/h' },
    { code: 'C3', name: 'Track C3 — Goods Loop / Freight Path', maxSpeed: '100 km/h' },
    { code: 'C4', name: 'Track C4 — Station Overtake / Shunt Yard', maxSpeed: '60 km/h' }
  ]

  const kmMarkers = [0, 15, 30, 45, 60, 75, 90, 100]

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              SIMULATED TRACK VIEW
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Corridor C2 • Salem (KM 0) ➔ Erode (KM 100)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sectional track alignment, kilometer posts, active defect pins, and scheduled possession blocks
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Critical Defect</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>High Defect</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-2 rounded bg-amber-500/30 border border-amber-500" />
            <span>Block Zone</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Clear Signal</span>
          </span>
        </div>
      </div>

      {/* Main Track Schematic Canvas */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 overflow-x-auto">
        <div className="min-w-[700px] space-y-6 py-2">
          {/* KM Header Scale */}
          <div className="relative h-6 border-b border-slate-800 flex justify-between text-[10px] font-mono text-slate-500 px-2">
            {kmMarkers.map((km) => (
              <div key={km} className="flex flex-col items-center">
                <span>KM {km}</span>
                <div className="w-0.5 h-2 bg-slate-700 mt-0.5" />
              </div>
            ))}
          </div>

          {/* 4 Track Lines */}
          <div className="space-y-6">
            {tracks.map((trk) => {
              const trackIssues = DEFAULT_ISSUES.filter((i) => i.track === trk.code)
              const trackBlocks = DEFAULT_BLOCKS.filter((b) => b.track === trk.code)

              return (
                <div key={trk.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300">
                      {trk.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Max: {trk.maxSpeed}
                    </span>
                  </div>

                  {/* The Track Rail Line */}
                  <div className="relative h-9 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center px-2">
                    {/* Continuous Twin Rails */}
                    <div className="absolute inset-x-0 top-3 h-[2px] bg-slate-700" />
                    <div className="absolute inset-x-0 bottom-3 h-[2px] bg-slate-700" />

                    {/* Sleepers Hash Pattern */}
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, #94a3b8 0px, #94a3b8 2px, transparent 2px, transparent 14px)'
                      }}
                    />

                    {/* Possession Block Zone overlay */}
                    {trackBlocks.map((blk, idx) => (
                      <div
                        key={idx}
                        className="absolute h-full bg-amber-500/20 border-x-2 border-amber-500 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300 z-10"
                        style={{
                          left: `${blk.startKm}%`,
                          width: `${blk.endKm - blk.startKm}%`
                        }}
                        title={`Block Possession: ${blk.window}`}
                      >
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50">
                          BLOCK {blk.window}
                        </span>
                      </div>
                    ))}

                    {/* Issue Pins positioned along KM */}
                    {trackIssues.map((iss) => {
                      const isSelected = activePin?.id === iss.id
                      const posPercent = (iss.km / 100) * 100

                      return (
                        <button
                          key={iss.id}
                          type="button"
                          onClick={() => {
                            setActivePin(iss)
                            if (onSelectIssue) onSelectIssue(iss.id)
                          }}
                          className={`absolute z-20 -top-1.5 -translate-x-1/2 flex flex-col items-center group transition-transform ${
                            isSelected ? 'scale-125' : 'hover:scale-110'
                          }`}
                          style={{ left: `${posPercent}%` }}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg border-2 ${
                              iss.severity === 'CRITICAL'
                                ? 'bg-rose-600 border-rose-400 ring-2 ring-rose-500/40 animate-pulse'
                                : iss.severity === 'HIGH'
                                ? 'bg-amber-600 border-amber-400'
                                : 'bg-blue-600 border-blue-400'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1 rounded border border-slate-700 mt-0.5">
                            KM {iss.km}
                          </span>
                        </button>
                      )
                    })}

                    {/* Signals at regular intervals */}
                    <div
                      className="absolute right-8 top-1.5 flex items-center space-x-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 z-10"
                      title="Automatic Block Signal S-44"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      <span className="text-[9px] font-mono text-slate-400">S-44</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Defect Detail Card */}
      {activePin && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-blue-400 text-sm">
                {activePin.id}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  activePin.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {activePin.severity} SEVERITY
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activePin.department}
              </span>
            </div>
            <p className="font-semibold text-white">{activePin.defectType}</p>
            <p className="text-slate-400 text-[11px]">
              Location: Track {activePin.track} at KM {activePin.km} • Status: {activePin.status}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Protection Required
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackVisualization
