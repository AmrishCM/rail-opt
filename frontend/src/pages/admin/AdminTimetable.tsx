import React from 'react'
import { Link } from 'react-router-dom'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Shield, Sliders } from 'lucide-react'

export const AdminTimetable: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>System Operations &bull; Central Timetable</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Operational Timetable</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Central network timetable, scheduled track possessions, and corridor train movements
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/approval-planning"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>Approval &amp; Planning</span>
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Configure Corridors</span>
          </Link>
        </div>
      </div>

      {/* Shared Operational Gantt Timeline */}
      <OperationalGanttTimeline
        readOnly={false}
        corridorId={2}
        selectedDate="2026-09-15"
      />
    </div>
  )
}

export default AdminTimetable

