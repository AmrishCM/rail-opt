import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { Clock, RotateCcw, ShieldAlert } from 'lucide-react'

export const ManagerTimetable: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Contextual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Operational Timetable</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Full corridor schedule, train movements, scheduled maintenance blocks, and possession conflict resolution
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/manager/approval-planning"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-800 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Approval & Planning</span>
          </Link>
          <Link
            to="/manager/replan"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Replanning Center</span>
          </Link>
        </div>
      </div>

      {/* Shared Operational Gantt Timeline */}
      <OperationalGanttTimeline
        readOnly={false}
        corridorId={2}
        selectedDate="2026-09-15"
        onOpenReplan={() => {
          navigate('/manager/replan')
        }}
      />
    </div>
  )
}

export default ManagerTimetable
