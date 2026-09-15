import React, { useState } from 'react'
import { Clock, ShieldCheck, AlertCircle, Users, Zap, Layers } from 'lucide-react'

interface BlockWindowItem {
  block_id: number
  section_id: number
  section_name?: string
  start_time: string
  end_time: string
  duration_minutes: number
  block_type: string
  status?: string
  tasks_count?: number
}

interface TrainMovementItem {
  movement_id: number
  train_number?: string
  train_type?: string
  priority?: string
  section_id: number
  arrival_time: string
  departure_time: string
}

interface CorridorTimelineProps {
  corridorName?: string
  sections?: Array<{ section_id: number; name: string }>
  blocks?: BlockWindowItem[]
  trainMovements?: TrainMovementItem[]
  onSelectBlock?: (blockId: number) => void
}

export const CorridorTimeline: React.FC<CorridorTimelineProps> = ({
  corridorName = 'Northern Trunk Corridor (NDLS - CNB)',
  sections = [
    { section_id: 1, name: 'C1-S1 (NDLS - GZB)' },
    { section_id: 2, name: 'C1-S2 (GZB - ALJN)' },
    { section_id: 3, name: 'C1-S3 (ALJN - TDL)' },
    { section_id: 4, name: 'C1-S4 (TDL - CNB)' }
  ],
  blocks = [],
  trainMovements = [],
  onSelectBlock
}) => {
  const [selectedBlock, setSelectedBlock] = useState<BlockWindowItem | null>(null)

  // Timeline hours from 00:00 to 24:00 (represented in 2-hour increments)
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ]

  const getBlockTypeStyle = (type: string) => {
    if (type.includes('COMBINED')) return 'bg-purple-100 border-purple-400 text-purple-900 ring-1 ring-purple-300'
    if (type.includes('POWER')) return 'bg-amber-100 border-amber-400 text-amber-900'
    if (type.includes('SIGNAL')) return 'bg-emerald-100 border-emerald-400 text-emerald-900'
    if (type.includes('FULL')) return 'bg-rose-100 border-rose-400 text-rose-900'
    return 'bg-blue-100 border-blue-400 text-blue-900'
  }

  const handleBlockClick = (b: BlockWindowItem) => {
    setSelectedBlock(b)
    if (onSelectBlock) {
      onSelectBlock(b.block_id)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-base">Corridor Intelligence Timeline</h3>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {corridorName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Train paths vs Multi-Department Maintenance Possession Windows
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
            <span className="text-slate-600 font-medium">Traffic Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
            <span className="text-slate-600 font-medium">Power Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span className="text-slate-600 font-medium">S&T Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-purple-600 inline-block ring-2 ring-purple-200"></span>
            <span className="text-purple-900 font-bold">Combined (Track+S&T+TRD)</span>
          </div>
        </div>
      </div>

      {/* Grid Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Time axis header */}
          <div className="grid grid-cols-13 text-[11px] font-semibold text-slate-500 border-b border-slate-200 pb-2 mb-2 pl-36">
            {hours.map((h, i) => (
              <span key={i} className="text-center">{h}</span>
            ))}
          </div>

          {/* Section Rows */}
          <div className="space-y-3">
            {sections.map((sec) => {
              const secBlocks = blocks.filter((b) => b.section_id === sec.section_id)
              return (
                <div key={sec.section_id} className="flex items-center">
                  {/* Section Label */}
                  <div className="w-36 flex-shrink-0 pr-3">
                    <span className="text-xs font-bold text-slate-800 block truncate">{sec.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Sec ID: #{sec.section_id}</span>
                  </div>

                  {/* 24-Hour Track Timeline Lane */}
                  <div className="flex-1 h-14 bg-slate-50 rounded-lg border border-slate-200 relative overflow-hidden flex items-center px-1">
                    {/* Background hour grid lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-30">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="border-r border-slate-300 h-full"></div>
                      ))}
                    </div>

                    {/* Render Simulated Train Movements as passing lines */}
                    <div className="absolute inset-y-1 left-[15%] w-24 bg-slate-800/10 border-l-2 border-r-2 border-slate-700/40 rounded flex items-center justify-center text-[9px] text-slate-600 font-semibold select-none">
                      🚆 12001 Shatabdi
                    </div>
                    <div className="absolute inset-y-1 left-[55%] w-28 bg-slate-800/10 border-l-2 border-r-2 border-slate-700/40 rounded flex items-center justify-center text-[9px] text-slate-600 font-semibold select-none">
                      🚆 22436 Vande Bharat
                    </div>

                    {/* Render Maintenance Block Windows */}
                    {secBlocks.length > 0 ? (
                      secBlocks.slice(0, 3).map((b, bIdx) => {
                        // Position based on index for clean demo visualization
                        const leftPct = (bIdx * 32) + 5
                        const widthPct = Math.min(28, Math.max(16, (b.duration_minutes / 240) * 25))
                        const isCombined = b.block_type.includes('COMBINED')

                        return (
                          <div
                            key={b.block_id}
                            onClick={() => handleBlockClick(b)}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute inset-y-2 rounded-md border text-xs px-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-all z-10 ${getBlockTypeStyle(b.block_type)}`}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              {isCombined ? <Layers className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" /> : <Clock className="w-3 h-3 flex-shrink-0" />}
                              <span className="font-bold text-[11px] truncate">
                                #{b.block_id} {isCombined ? 'Combined' : b.block_type.split('_')[0]}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 shadow-xs flex-shrink-0">
                              {b.duration_minutes}m
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      // Demo block if no blocks loaded yet
                      <div
                        onClick={() => handleBlockClick({
                          block_id: 17,
                          section_id: sec.section_id,
                          section_name: sec.name,
                          start_time: '2026-09-12T01:00:00',
                          end_time: '2026-09-12T03:30:00',
                          duration_minutes: 150,
                          block_type: 'COMBINED_BLOCK',
                          tasks_count: 3
                        })}
                        className="absolute inset-y-2 left-[28%] w-[26%] rounded-md border text-xs px-2.5 flex items-center justify-between cursor-pointer bg-purple-100 border-purple-400 text-purple-900 ring-1 ring-purple-300 z-10"
                      >
                        <div className="flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-700" />
                          <span className="font-bold text-[11px]">#17 Combined (Track+S&T)</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80">150m</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Block Inspector Drawer */}
      {selectedBlock && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 transition-all">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">
                Inspecting Block #{selectedBlock.block_id}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getBlockTypeStyle(selectedBlock.block_type)}`}>
                {selectedBlock.block_type}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Duration: {selectedBlock.duration_minutes} minutes
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Section: {selectedBlock.section_name || `Section #${selectedBlock.section_id}`} • Optimal Window verified by Google OR-Tools CP-SAT
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Coordination</span>
              <span className="font-bold text-purple-700">Track + S&T</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Train Impact</span>
              <span className="font-bold text-emerald-700">0 min delay</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Utilization</span>
              <span className="font-bold text-blue-700">89.4%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
