import React from 'react'
import { Link } from 'react-router-dom'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, Shield, Sliders, Settings } from 'lucide-react'

export const AdminTimetable: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="bg-white border border-[#d7dde1] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#8f1d2c] font-black text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>SYSTEM OPERATIONS</span>
          </div>
          <h1 className="text-2xl font-black text-[#172027]">Operational Timetable</h1>
          <p className="text-xs text-[#59636b] mt-0.5">
            Central network timetable, scheduled track possessions, and corridor train movements
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/approval-planning"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172027] text-xs font-bold border border-[#d7dde1] transition-all"
          >
            <Shield className="w-4 h-4 text-[#8f1d2c]" />
            <span>Approval & Planning</span>
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-[#8f1d2c] hover:bg-[#711522] text-white text-xs font-black transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4" />
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
