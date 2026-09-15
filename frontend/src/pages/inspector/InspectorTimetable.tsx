import React from 'react'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Eye } from 'lucide-react'

export const InspectorTimetable: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="bg-white border border-[#d7dde1] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#8f1d2c] font-black text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>FIELD OPERATIONS</span>
          </div>
          <h1 className="text-2xl font-black text-[#172027]">Operational Timetable</h1>
          <p className="text-xs text-[#59636b] mt-0.5">
            Real-time train movements, scheduled maintenance possessions, and defect inspection windows
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Read-Only Inspector Access</span>
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

export default InspectorTimetable
