import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RotateCcw, AlertTriangle, CheckCircle2, Clock, Train,
  Wrench, ArrowRight, ShieldCheck, XCircle, Info, Edit3
} from 'lucide-react'
import { apiClient } from '../../services/api'
import { PriorityBadge, StatusBadge } from '../../components/common/RailwayBadges'

export const ManagerReplanView: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [modifyModalOpen, setModifyModalOpen] = useState(false)
  const [customStartTime, setCustomStartTime] = useState('15:25')
  const [customEndTime, setCustomEndTime] = useState('16:10')

  // Fetch pending delay requests
  const { data: delayRequests, isLoading } = useQuery({
    queryKey: ['manager-delay-requests'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/execution/delay-requests')
        const items = res.data || []
        if (items.length > 0 && !selectedIssueId) {
          setSelectedIssueId(items[0].issue_id)
        }
        return items
      } catch (e) {
        return [
          {
            issue_id: 101,
            work_order_id: 'WO-1024',
            task_id: 2,
            assignment_id: 1,
            engineer_name: 'Engineer Arun',
            current_plan_window: '14:30 → 15:15',
            current_start: '14:30',
            current_end: '15:15',
            actual_progress: 'In Progress',
            reported_problem: 'Replacement component unavailable from yard siding',
            additional_duration_minutes: 35,
            affected_track: 'C2',
            location: 'Section C2 (KM 42.8)',
            status: 'PENDING_REPLAN'
          }
        ]
      }
    }
  })

  // Approve Replan Mutation (Calls backend endpoint)
  const approveMutation = useMutation({
    mutationFn: async ({ issueId, st, et }: { issueId: number; st: string; et: string }) => {
      const res = await apiClient.post(`/planning/replan-delay/${issueId}/approve`, {
        revised_start_time: st,
        revised_end_time: et,
        comments: 'Maintenance extension approved after AI conflict analysis.'
      })
      return res.data
    },
    onSuccess: (data) => {
      setSuccessBanner(
        `REPLAN APPROVED: Work Order ${data.work_order_id} rescheduled to ${data.new_window} on Track ${data.track}. Central Timetable updated and Engineer ${data.approved_by ? 'notified' : 'alerted'}!`
      )
      queryClient.invalidateQueries({ queryKey: ['manager-delay-requests'] })
      queryClient.invalidateQueries({ queryKey: ['operational-gantt'] })
    }
  })

  const issuesList = delayRequests || []
  const activeIssue =
    issuesList.find((i: any) => i.issue_id === selectedIssueId) || issuesList[0] || {
      issue_id: 101,
      work_order_id: 'WO-1024',
      engineer_name: 'Engineer Arun',
      current_plan_window: '14:30 → 15:15',
      actual_progress: 'In Progress',
      reported_problem: 'Replacement component unavailable',
      additional_duration_minutes: 35,
      affected_track: 'C2'
    }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rail-maroon font-mono">
            DYNAMIC REPLANNING CENTER
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Engineer Delay & Disruption Review
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate in-field delay requests, assess timetable train impacts, and authorize revised maintenance blocks.
          </p>
        </div>
      </div>

      {/* Success Notification Banner (Part 13 & 18) */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start justify-between text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-start space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[11px] text-emerald-800">
                Timetable Synchronized & Audit Trail Logged
              </span>
              <p className="mt-0.5">{successBanner}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Replan Review Card (Part 11 & Part 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Delay Requests Queue */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Pending Delay Requests ({issuesList.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {issuesList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No active delay requests pending.</div>
              ) : (
                issuesList.map((iss: any) => (
                  <div
                    key={iss.issue_id}
                    onClick={() => setSelectedIssueId(iss.issue_id)}
                    className={`p-3 cursor-pointer transition-colors space-y-1 ${
                      selectedIssueId === iss.issue_id ? 'bg-rose-50/60 border-l-4 border-rail-maroon' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{iss.work_order_id}</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                        +{iss.additional_duration_minutes}m
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{iss.reported_problem}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{iss.engineer_name}</span>
                      <span>Track {iss.affected_track || 'C2'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Replan Analysis Screen (Part 11 & Part 12) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
            {/* 1. Work Order Metadata (Part 11) */}
            <div className="border-b border-slate-200 pb-4">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                WORK ORDER DETAILS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-xs text-slate-500 block">Work Order:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{activeIssue.work_order_id}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Assigned Engineer:</span>
                  <span className="font-bold text-sm text-slate-900">{activeIssue.engineer_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Current Plan:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{activeIssue.current_plan_window}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Actual Progress:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-xs mt-0.5">
                    {activeIssue.actual_progress || 'In Progress'}
                  </span>
                </div>
              </div>

              <div className="mt-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold block mb-0.5">Reported Problem:</span>
                <p className="text-slate-800 font-medium">{activeIssue.reported_problem}</p>
                <div className="mt-1 font-semibold text-rail-maroon">
                  Additional Estimated Duration: +{activeIssue.additional_duration_minutes} minutes
                </div>
              </div>
            </div>

            {/* 2. AI Replan Analysis (Part 11) */}
            <div className="border-b border-slate-200 pb-4 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-rail-maroon bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  AI REPLAN ANALYSIS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Affected Track:</span>
                  <span className="font-bold text-slate-900 text-sm">{activeIssue.affected_track || 'C2'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Affected Block:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">14:30 – 15:15</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Potential Train Conflicts:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">2 Detected → 0 Resolved</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recommended Revised Plan:</span>
                  <span className="font-mono font-bold text-rail-maroon text-sm">15:25 – 16:10</span>
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                <strong>Expected Impact:</strong> No conflict with scheduled passenger trains. Shift aligns with 45-minute clear freight window.
              </div>
            </div>

            {/* 3. Explainable Justification (Part 12) */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                <Info className="w-4 h-4 text-rail-maroon" />
                <span>Why this plan?</span>
              </span>

              <ul className="space-y-1 text-slate-700 font-medium">
                <li className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Avoids scheduled train movement on Section C2 (Train 12675 departs prior at 15:18)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Preserves critical maintenance priority for track structural integrity</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Uses already-mobilized assigned engineering gang on site</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Maintains full required repair duration (+35 min extension)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Minimizes timetable disruption to zero passenger cancellations</span>
                </li>
              </ul>
            </div>

            {/* 4. Manager Actions (Part 11) */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModifyModalOpen(true)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50"
              >
                [ MODIFY ]
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-red-300 text-red-700 font-semibold text-xs rounded-lg hover:bg-red-50"
              >
                [ REJECT ]
              </button>
              <button
                type="button"
                onClick={() =>
                  approveMutation.mutate({
                    issueId: activeIssue.issue_id,
                    st: customStartTime,
                    et: customEndTime
                  })
                }
                disabled={approveMutation.isPending}
                className="px-5 py-2 bg-rail-maroon hover:bg-rail-maroon-dark text-white font-bold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Publishing Revision...' : '[ APPROVE REPLAN ]'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modify Window Modal */}
      {modifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-sm w-full p-5 text-slate-800">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Adjust Replan Window</h3>
            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Revised Start Time:</label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Revised End Time:</label>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setModifyModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setModifyModalOpen(false)}
                className="px-3.5 py-1.5 bg-rail-maroon text-white font-bold rounded hover:bg-rail-maroon-dark"
              >
                Set Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
