import React, { useState, useMemo } from 'react'
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Train as TrainIcon,
  Wrench,
  Maximize2,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react'

export interface TimeSpaceDiagramProps {
  corridorId?: number
  selectedDate?: string
  className?: string
  onBlockClick?: (block: any) => void
}

interface Station {
  code: string
  name: string
  km: number
}

const CORRIDOR_STATIONS: Station[] = [
  { code: 'SA', name: 'Salem Jn', km: 0.0 },
  { code: 'SGE', name: 'Sankari Durg', km: 34.5 },
  { code: 'ED', name: 'Erode Jn', km: 59.8 },
  { code: 'TUP', name: 'Tiruppur', km: 104.2 },
  { code: 'CBE', name: 'Coimbatore Jn', km: 149.5 },
]

const TOTAL_CORRIDOR_KM = 149.5

interface ScheduledTrain {
  trainNumber: string
  name: string
  type: 'VANDE_BHARAT' | 'EXPRESS' | 'PASSENGER' | 'FREIGHT'
  direction: 'UP' | 'DOWN'
  startKm: number
  endKm: number
  startMin: number // minutes from midnight (e.g. 08:00 = 480)
  endMin: number
  speedKmh: number
  color: string
}

const TIME_SPACE_TRAINS: ScheduledTrain[] = [
  {
    trainNumber: '20643',
    name: 'Vande Bharat Express',
    type: 'VANDE_BHARAT',
    direction: 'DOWN',
    startKm: 0.0,
    endKm: 149.5,
    startMin: 855, // 14:15
    endMin: 945, // 15:45 (90 mins, ~100 km/h avg)
    speedKmh: 130,
    color: '#06b6d4' // cyan-500
  },
  {
    trainNumber: '12675',
    name: 'Kovai Superfast Express',
    type: 'EXPRESS',
    direction: 'DOWN',
    startKm: 0.0,
    endKm: 149.5,
    startMin: 690, // 11:30
    endMin: 795, // 13:15
    speedKmh: 110,
    color: '#3b82f6' // blue-500
  },
  {
    trainNumber: '12676',
    name: 'Kovai Express (Return)',
    type: 'EXPRESS',
    direction: 'UP',
    startKm: 149.5,
    endKm: 0.0,
    startMin: 870, // 14:30
    endMin: 975, // 16:15
    speedKmh: 110,
    color: '#60a5fa' // blue-400
  },
  {
    trainNumber: '12671',
    name: 'Nilagiri Express',
    type: 'EXPRESS',
    direction: 'DOWN',
    startKm: 0.0,
    endKm: 149.5,
    startMin: 570, // 09:30
    endMin: 685, // 11:25
    speedKmh: 100,
    color: '#818cf8' // indigo-400
  },
  {
    trainNumber: '56713',
    name: 'Salem–Erode Passenger',
    type: 'PASSENGER',
    direction: 'DOWN',
    startKm: 0.0,
    endKm: 59.8,
    startMin: 610, // 10:10
    endMin: 690, // 11:30
    speedKmh: 65,
    color: '#34d399' // emerald-400
  },
  {
    trainNumber: 'B-BOXN-42',
    name: 'Thermal Coal Freight',
    type: 'FREIGHT',
    direction: 'DOWN',
    startKm: 0.0,
    endKm: 149.5,
    startMin: 760, // 12:40
    endMin: 910, // 15:10
    speedKmh: 60,
    color: '#fbbf24' // amber-400
  }
]

interface MaintenancePossessionZone {
  id: string
  title: string
  status: 'PROPOSED' | 'GRANTED'
  startKm: number
  endKm: number
  startMin: number
  endMin: number
  departments: string[]
  trackId: string
  isShadowed: boolean
  speedRestrictionKmh?: number
}

const POSSESSION_ZONES: MaintenancePossessionZone[] = [
  {
    id: 'BLK-C2-02',
    title: 'Joint Track & S&T Possession (Km 42.0 – 45.0)',
    status: 'GRANTED',
    startKm: 42.0,
    endKm: 45.0,
    startMin: 840, // 14:00
    endMin: 990, // 16:30
    departments: ['Track', 'S&T', 'Traction'],
    trackId: 'DN_MAIN',
    isShadowed: true,
    speedRestrictionKmh: 30
  },
  {
    id: 'BLK-C2-04',
    title: 'Proposed OHE Wire Renewal & Bridge Inspection',
    status: 'PROPOSED',
    startKm: 112.0,
    endKm: 118.5,
    startMin: 660, // 11:00
    endMin: 780, // 13:00
    departments: ['Traction', 'Bridges'],
    trackId: 'UP_MAIN',
    isShadowed: true,
    speedRestrictionKmh: 45
  }
]

export const CorridorTimeSpaceDiagram: React.FC<TimeSpaceDiagramProps> = ({
  corridorId = 2,
  selectedDate = '2026-09-15',
  className = '',
  onBlockClick
}) => {
  // Zoom window in minutes
  const [windowStartMin, setWindowStartMin] = useState<number>(540) // 09:00
  const [windowSpanHours, setWindowSpanHours] = useState<number>(8) // 8h window -> 09:00 to 17:00
  const [selectedElement, setSelectedElement] = useState<{ type: 'train' | 'block'; data: any } | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'PASSENGER' | 'FREIGHT'>('ALL')

  const totalWindowMin = windowSpanHours * 60
  const windowEndMin = windowStartMin + totalWindowMin

  // SVG canvas coordinates
  const svgWidth = 900
  const svgHeight = 440
  const padLeft = 90
  const padRight = 30
  const padTop = 30
  const padBottom = 40

  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  // Conversion helpers
  const timeToX = (min: number): number => {
    const fraction = (min - windowStartMin) / totalWindowMin
    return padLeft + fraction * plotWidth
  }

  const kmToY = (km: number): number => {
    const fraction = km / TOTAL_CORRIDOR_KM
    return padTop + fraction * plotHeight
  }

  // Time ticks
  const timeTicks = useMemo(() => {
    const ticks: { min: number; label: string; x: number }[] = []
    const stepMin = windowSpanHours <= 4 ? 30 : 60
    for (let m = windowStartMin; m <= windowEndMin; m += stepMin) {
      const h = Math.floor(m / 60) % 24
      const mins = m % 60
      const label = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      ticks.push({ min: m, label, x: timeToX(m) })
    }
    return ticks
  }, [windowStartMin, windowSpanHours])

  const filteredTrains = useMemo(() => {
    if (filterType === 'PASSENGER') return TIME_SPACE_TRAINS.filter(t => t.type !== 'FREIGHT')
    if (filterType === 'FREIGHT') return TIME_SPACE_TRAINS.filter(t => t.type === 'FREIGHT')
    return TIME_SPACE_TRAINS
  }, [filterType])

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header Bar */}
      <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/70">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Railway Time-Space Corridor Trajectory View (Marey String Chart)
              </h2>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Corridor C2: Salem ➔ Coimbatore
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Continuous train trajectories intersected with multi-department proposed vs granted maintenance possession blocks.
            </p>
          </div>
        </div>

        {/* Zoom & Window Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom Selector */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-xs font-mono">
            {[4, 8, 12, 24].map((h) => (
              <button
                key={h}
                onClick={() => setWindowSpanHours(h)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  windowSpanHours === h
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Time Navigation */}
          <button
            onClick={() => setWindowStartMin(Math.max(0, windowStartMin - 120))}
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"
            title="Pan back 2 hours"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWindowStartMin(Math.min(1440 - totalWindowMin, windowStartMin + 120))}
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"
            title="Pan forward 2 hours"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-[11px] font-mono text-zinc-300">Vande Bharat (130 km/h)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-blue-500 inline-block" />
            <span className="text-[11px] font-mono text-zinc-300">Superfast Express</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
            <span className="text-[11px] font-mono text-zinc-300">Passenger / Local</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span className="text-[11px] font-mono text-zinc-300">Freight (Goods Train)</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500 inline-block" />
            <span className="text-[11px] font-mono text-emerald-300">Granted Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-2.5 rounded-xs bg-amber-500/20 border border-amber-500 border-dashed inline-block" />
            <span className="text-[11px] font-mono text-amber-300">Proposed Block (Shadowed)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative overflow-x-auto p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none font-mono"
          style={{ minWidth: '700px' }}
        >
          <defs>
            {/* Striped pattern for proposed block window */}
            <pattern id="proposed-stripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="2" strokeOpacity="0.4" />
            </pattern>
            {/* Grid glow */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#06b6d4" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background grid */}
          <rect x={padLeft} y={padTop} width={plotWidth} height={plotHeight} fill="#09090b" rx="4" />

          {/* Station horizontal lines */}
          {CORRIDOR_STATIONS.map((st) => {
            const y = kmToY(st.km)
            return (
              <g key={st.code}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + plotWidth}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-400 text-[10px] font-mono"
                >
                  {st.name} ({st.km.toFixed(0)} km)
                </text>
              </g>
            )
          })}

          {/* Time vertical grid lines */}
          {timeTicks.map((t) => (
            <g key={t.min}>
              <line
                x1={t.x}
                y1={padTop}
                x2={t.x}
                y2={padTop + plotHeight}
                stroke="#1f1f23"
                strokeWidth="1"
              />
              <text
                x={t.x}
                y={padTop + plotHeight + 16}
                textAnchor="middle"
                className="fill-zinc-500 text-[10px] font-mono"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* Current Simulation Time Marker (14:20 = 860 min) */}
          {860 >= windowStartMin && 860 <= windowEndMin && (
            <g>
              <line
                x1={timeToX(860)}
                y1={padTop}
                x2={timeToX(860)}
                y2={padTop + plotHeight}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <rect
                x={timeToX(860) - 22}
                y={padTop - 18}
                width="44"
                height="14"
                rx="3"
                fill="#ef4444"
              />
              <text
                x={timeToX(860)}
                y={padTop - 8}
                textAnchor="middle"
                fill="#ffffff"
                className="text-[9px] font-bold"
              >
                14:20 NOW
              </text>
            </g>
          )}

          {/* Maintenance Possession Blocks (Rectangles) */}
          {POSSESSION_ZONES.map((b) => {
            const bx1 = timeToX(b.startMin)
            const bx2 = timeToX(b.endMin)
            const by1 = kmToY(b.startKm)
            const by2 = kmToY(b.endKm)

            const w = Math.max(10, bx2 - bx1)
            const h = Math.max(16, by2 - by1)

            const isGranted = b.status === 'GRANTED'

            return (
              <g
                key={b.id}
                onClick={() => {
                  setSelectedElement({ type: 'block', data: b })
                  if (onBlockClick) onBlockClick(b)
                }}
                className="cursor-pointer transition-opacity hover:opacity-90 group"
              >
                <rect
                  x={bx1}
                  y={by1}
                  width={w}
                  height={h}
                  rx="4"
                  fill={isGranted ? 'rgba(16, 185, 129, 0.18)' : 'url(#proposed-stripes)'}
                  stroke={isGranted ? '#10b981' : '#f59e0b'}
                  strokeWidth="1.5"
                  strokeDasharray={isGranted ? 'none' : '4,3'}
                />
                <text
                  x={bx1 + 6}
                  y={by1 + 13}
                  className="fill-zinc-100 text-[9px] font-bold font-mono pointer-events-none"
                >
                  {isGranted ? '✓ GRANTED POSSESSION' : '⚡ PROPOSED SHADOW'}
                </text>
                <text
                  x={bx1 + 6}
                  y={by1 + 24}
                  className={isGranted ? 'fill-emerald-300 text-[8px]' : 'fill-amber-300 text-[8px]'}
                >
                  {b.departments.join(' + ')} • {b.id}
                </text>
              </g>
            )
          })}

          {/* Train Trajectory Sloped Lines */}
          {filteredTrains.map((tr) => {
            const x1 = timeToX(tr.startMin)
            const y1 = kmToY(tr.startKm)
            const x2 = timeToX(tr.endMin)
            const y2 = kmToY(tr.endKm)

            const isVandeBharat = tr.type === 'VANDE_BHARAT'

            return (
              <g
                key={tr.trainNumber}
                onClick={() => setSelectedElement({ type: 'train', data: tr })}
                className="cursor-pointer group"
              >
                {/* Thick invisible hover target */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="14"
                />

                {/* Visible Trajectory Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={tr.color}
                  strokeWidth={isVandeBharat ? '2.5' : '1.8'}
                  filter={isVandeBharat ? 'url(#glow-cyan)' : undefined}
                />

                {/* Train Badge at midpoint */}
                <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                  <rect
                    x="-24"
                    y="-8"
                    width="48"
                    height="16"
                    rx="3"
                    fill="#18181b"
                    stroke={tr.color}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={tr.color}
                    className="text-[8px] font-bold"
                  >
                    {tr.trainNumber}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Detected Conflict Intersection Tag */}
          <g transform={`translate(${timeToX(895)}, ${kmToY(43.5)})`}>
            <circle cx="0" cy="0" r="8" fill="#ef4444" className="animate-ping opacity-60" />
            <circle cx="0" cy="0" r="5" fill="#ef4444" />
            <rect x="8" y="-12" width="130" height="22" rx="3" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
            <text x="14" y="3" fill="#fca5a5" className="text-[8px] font-bold">
              TIMETABLE OVERLAP: 20643
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Element Drawer / Popover */}
      {selectedElement && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between animate-in fade-in-50 text-xs">
          {selectedElement.type === 'train' ? (
            <div className="flex items-center space-x-3">
              <TrainIcon className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <span className="font-bold text-zinc-100 font-mono">
                  {selectedElement.data.trainNumber} • {selectedElement.data.name}
                </span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Direction: {selectedElement.data.direction} • Max Speed: {selectedElement.data.speedKmh} km/h • Type: {selectedElement.data.type}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Wrench className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-zinc-100 font-mono">
                  {selectedElement.data.id} • {selectedElement.data.title}
                </span>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Status: {selectedElement.data.status} • Departments: {selectedElement.data.departments.join(', ')} • SR: {selectedElement.data.speedRestrictionKmh || 30} km/h
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setSelectedElement(null)}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
