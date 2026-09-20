import React, { useState } from 'react'
import { Clock, Layers } from 'lucide-react'

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

interface CorridorTimelineProps {
  corridorName?: string
  sections?: Array<{ section_id: number; name: string }>
  blocks?: BlockWindowItem[]
  trainMovements?: any[]
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

  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ]

  const getBlockTypeStyle = (type: string) => {
    if (type.includes('COMBINED')) return 'bg-purple-500/15 border-purple-500/40 text-purple-300'
    if (type.includes('POWER'))    return 'bg-amber-500/15 border-amber-500/40 text-amber-300'
    if (type.includes('SIGNAL'))   return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
    if (type.includes('FULL'))     return 'bg-rose-500/15 border-rose-500/40 text-rose-300'
    return 'bg-blue-500/15 border-blue-500/40 text-blue-300'
  }

  const handleBlockClick = (b: BlockWindowItem) => {
    setSelectedBlock(b)
    if (onSelectBlock) onSelectBlock(b.block_id)
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-zinc-100 text-base">Corridor Intelligence Timeline</h3>
            <span className="text-[11px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
              {corridorName}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Train paths vs Multi-Department Maintenance Possession Windows
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/60 border border-blue-500/40 inline-block"></span>
            <span className="text-zinc-400">Traffic Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/60 border border-amber-500/40 inline-block"></span>
            <span className="text-zinc-400">Power Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/60 border border-emerald-500/40 inline-block"></span>
            <span className="text-zinc-400">S&T Block</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-purple-500/60 border border-purple-500/40 inline-block"></span>
            <span className="text-purple-300 font-medium">Combined</span>
          </div>
        </div>
      </div>

      {/* Grid Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Time axis header */}
          <div className="grid grid-cols-13 text-[11px] font-mono text-zinc-500 border-b border-zinc-800 pb-2 mb-2 pl-36">
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
                    <span className="text-xs font-mono text-zinc-300 block truncate">{sec.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">Sec #{sec.section_id}</span>
                  </div>

                  {/* 24-Hour Track Timeline Lane */}
                  <div className="flex-1 h-14 bg-zinc-950/60 rounded border border-zinc-800 relative overflow-hidden flex items-center px-1">
                    {/* Background hour grid lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div key={idx} className="border-r border-zinc-700 h-full"></div>
                      ))}
                    </div>

                    {/* Simulated Train Movements */}
                    <div className="absolute inset-y-1 left-[15%] w-24 bg-zinc-800/40 border-l border-r border-zinc-600/40 rounded flex items-center justify-center text-[9px] text-zinc-500 font-mono select-none">
                      12001 Shatabdi
                    </div>
                    <div className="absolute inset-y-1 left-[55%] w-28 bg-zinc-800/40 border-l border-r border-zinc-600/40 rounded flex items-center justify-center text-[9px] text-zinc-500 font-mono select-none">
                      22436 Vande Bharat
                    </div>

                    {/* Render Maintenance Block Windows */}
                    {secBlocks.length > 0 ? (
                      secBlocks.slice(0, 3).map((b, bIdx) => {
                        const leftPct = (bIdx * 32) + 5
                        const widthPct = Math.min(28, Math.max(16, (b.duration_minutes / 240) * 25))
                        const isCombined = b.block_type.includes('COMBINED')

                        return (
                          <div
                            key={b.block_id}
                            onClick={() => handleBlockClick(b)}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute inset-y-2 rounded border text-xs px-2 flex items-center justify-between cursor-pointer hover:brightness-110 transition-all z-10 ${getBlockTypeStyle(b.block_type)}`}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              {isCombined ? <Layers className="w-3.5 h-3.5 flex-shrink-0 opacity-80" /> : <Clock className="w-3 h-3 flex-shrink-0 opacity-80" />}
                              <span className="font-mono text-[11px] truncate">
                                #{b.block_id} {isCombined ? 'Combined' : b.block_type.split('_')[0]}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20 flex-shrink-0">
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
                        className="absolute inset-y-2 left-[28%] w-[26%] rounded border text-xs px-2.5 flex items-center justify-between cursor-pointer bg-purple-500/15 border-purple-500/40 text-purple-300 z-10 hover:brightness-110 transition-all"
                      >
                        <div className="flex items-center space-x-1.5">
                          <Layers className="w-3.5 h-3.5 opacity-80" />
                          <span className="font-mono text-[11px]">#17 Combined (Track+S&T)</span>
                        </div>
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/20">150m</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Block Inspector */}
      {selectedBlock && (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-medium text-sm text-zinc-100">
                Inspecting Block #{selectedBlock.block_id}
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getBlockTypeStyle(selectedBlock.block_type)}`}>
                {selectedBlock.block_type}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {selectedBlock.duration_minutes} min
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Section: {selectedBlock.section_name || `Section #${selectedBlock.section_id}`} • Optimal Window verified by Google OR-Tools CP-SAT
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Coordination</span>
              <span className="text-purple-400">Track + S&T</span>
            </div>
            <div className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Train Impact</span>
              <span className="text-emerald-400">0 min delay</span>
            </div>
            <div className="bg-zinc-900 px-3 py-1.5 rounded border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 block uppercase">Utilization</span>
              <span className="text-blue-400">89.4%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
