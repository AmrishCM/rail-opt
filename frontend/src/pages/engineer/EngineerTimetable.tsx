import React from 'react'
import { Link } from 'react-router-dom'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Wrench, ShieldCheck } from 'lucide-react'

export const EngineerTimetable: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Engineering Workspace &bull; Corridor Timetable</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Operational Timetable</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Assigned maintenance possessions, track clearing deadlines, and real-time train paths
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/engineer/pending-work"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>My Work Queue</span>
          </Link>
          <span className="text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>Possession Scope: Active Block</span>
          </span>
        </div>
      </div>

      {/* Shared Operational Gantt Timeline with Mock Traffic Data */}
      <OperationalGanttTimeline
        readOnly={true}
        corridorId={2}
        selectedDate="2026-09-15"
      />
    </div>
  )
}

export default EngineerTimetable

