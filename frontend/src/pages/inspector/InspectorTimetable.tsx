import React from 'react'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Eye } from 'lucide-react'

export const InspectorTimetable: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Operational Timetable</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time train movements, scheduled maintenance possessions, and defect inspection windows
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
            <span>Inspector View (Read-Only)</span>
          </span>
        </div>
      </div>

      {/* Shared Operational Gantt Timeline with Mock Trains and Work Blocks */}
      <OperationalGanttTimeline
        readOnly={true}
        corridorId={2}
        selectedDate="2026-09-15"
      />
    </div>
  )
}

export default InspectorTimetable
