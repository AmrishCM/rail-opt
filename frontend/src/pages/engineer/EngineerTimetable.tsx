import React from 'react'
import { Link } from 'react-router-dom'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Wrench, Lock, AlertCircle } from 'lucide-react'

export const EngineerTimetable: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="bg-white border border-[#d7dde1] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#8f1d2c] font-black text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>ENGINEERING WORKSPACE</span>
          </div>
          <h1 className="text-2xl font-black text-[#172027]">Operational Timetable</h1>
          <p className="text-xs text-[#59636b] mt-0.5">
            Assigned maintenance possessions, track clearing deadlines, and adjacent train movements
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/engineer/pending-work"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-all"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>My Work Queue</span>
          </Link>
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Possession Scope: Active Block</span>
          </span>
        </div>
      </div>

      {/* Shared Operational Gantt Timeline */}
      <OperationalGanttTimeline
        readOnly={true}
        corridorId={2}
        selectedDate="2026-09-15"
      />
    </div>
  )
}

export default EngineerTimetable
