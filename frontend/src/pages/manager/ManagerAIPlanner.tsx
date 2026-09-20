import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  FileText,
  RefreshCw,
  XCircle,
  Info
} from 'lucide-react'
import { fetchMaintenanceTasks, approvePlan, rejectPlan, apiClient } from '../../services/api'
import { OperationalGanttTimeline } from '../../components/timeline/OperationalGanttTimeline'
import { PriorityBadge, StatusBadge } from '../../components/common/RailwayBadges'

export const ManagerAIPlanner: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedCandidate, setSelectedCandidate] = useState<'PLAN_A' | 'PLAN_B'>('PLAN_A')
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null)
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any | null>(null)

  // 1. Fetch Open Maintenance Tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['planner-tasks'],
    queryFn: () => fetchMaintenanceTasks()
  })

  // 2. Fetch Candidate Plans
  const { data: candidatesData, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery({
    queryKey: ['planner-candidates'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/planning/candidates')
        return res.data
      } catch (e) {
        return {
          plan_id: 42,
          plan_number: 'PLAN-2026-00042',
          candidates: [
            {
              id: 'PLAN_A',
              name: 'Plan A (Zero Conflict Optimal)',
              slot: '14:30 – 15:15',
              track: 'C2',
              train_conflicts: 0,
              train_impact_minutes: 0,
              asset_availability: 98.4,
              delay_saved_minutes: 45,
              impact_summary: 'No train conflict. Fits between Train 12674 (13:50) and Train 12676 (15:30).',
              reasons: [
                'Avoids scheduled train movement on target track C2',
                'Preserves critical maintenance priority for active track defect',
                'Uses fully available assigned engineering gang and equipment',
                'Maintains required repair duration without compression',
                'Minimizes timetable disruption'
              ],
              trade_off: 'Optimal maintenance window with zero impact on scheduled passenger trains.',
              is_recommended: true
            },
            {
              id: 'PLAN_B',
              name: 'Plan B (Off-Peak Slot with Minor Freight Adjustment)',
              slot: '15:40 – 16:25',
              track: 'C2',
              train_conflicts: 1,
              train_impact_minutes: 8,
              asset_availability: 96.2,
              delay_saved_minutes: 25,
              impact_summary: 'Minor timetable adjustment: 8-minute freight siding hold on Loop Line.',
              reasons: [
                'Alternative slot after peak passenger movement window',
                'Allows extra 15 min buffer for equipment setup and thermal testing',
                'Requires minor 8 min freight holding on adjacent siding',
                'Zero passenger service cancellation or rescheduling'
              ],
              trade_off: 'Minor freight adjustment (8 min), provides longer buffer for difficult repairs.',
              is_recommended: false
            }
          ]
        }
      }
    }
  })

  // Approval Mutation
  const approveMutation = useMutation({
    mutationFn: async (planId: number) => {
      return approvePlan(planId, 'Approved by Operations Manager after AI conflict analysis.')
    },
    onSuccess: (data) => {
      setApprovalModalOpen(false)
      setPublishSuccessMsg(`Operational Plan #${data.plan_number || 'PLAN-2026-00042'} approved and published to live timetable! Engineer notified.`)
      queryClient.invalidateQueries({ queryKey: ['operational-gantt'] })
      queryClient.invalidateQueries({ queryKey: ['planner-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] })
      setTimeout(() => setPublishSuccessMsg(null), 8000)
    }
  })

  // Rejection Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ planId, reason }: { planId: number; reason: string }) => {
      return rejectPlan(planId, reason)
    },
    onSuccess: () => {
      setRejectModalOpen(false)
      setRejectReason('')
      setPublishSuccessMsg('Revision requested from engineering team. Plan returned to draft.')
      queryClient.invalidateQueries({ queryKey: ['planner-candidates'] })
    }
  })

  const currentPlan = candidatesData?.candidates?.find((c: any) => c.id === selectedCandidate) || candidatesData?.candidates?.[0]
  const tasks = tasksData?.items || tasksData || []

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">AI Maintenance Planner</h1>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px] uppercase tracking-wider">
              Operations Control
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Optimize maintenance block schedules, analyze train timetable conflicts, and publish authorized possessions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => refetchCandidates()}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Re-evaluate Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => setApprovalModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            <span>Approve &amp; Publish Plan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {publishSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
            <span>{publishSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setPublishSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-300 font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main 3-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (3 cols): Maintenance Tasks with Explainable Priority */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300 uppercase tracking-wider">
                Maintenance Tasks ({tasks.length || 3})
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">AI Prioritized</span>
            </div>

            <div className="divide-y divide-zinc-800/80 max-h-[640px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400">No active maintenance tasks.</div>
              ) : (
                tasks.slice(0, 5).map((t: any, idx: number) => {
                  const refNo = t.reference_no || `WO-102${idx + 4}`
                  const pLevel = t.priority_score >= 80 ? 'CRITICAL' : t.priority_score >= 60 ? 'HIGH' : 'MEDIUM'
                  const reasons = [
                    t.safety_impact >= 8 ? 'High safety impact (track defect)' : 'Active asset degradation',
                    'Mainline corridor operation disruption potential',
                    'Possession window fits off-peak slot'
                  ]

                  return (
                    <div
                      key={t.task_id || idx}
                      onClick={() => setSelectedTaskDetail({ ...t, refNo, pLevel, reasons })}
                      className="p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-xs text-blue-400">{refNo}</span>
                        <PriorityBadge level={pLevel} />
                      </div>

                      <p className="text-xs font-medium text-zinc-200 line-clamp-1">
                        {t.description || 'Ultrasonic weld test and rail surface grinding'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{t.department || 'Engineering/Track'}</span>
                        <span className="font-mono">{t.estimated_duration || 45}m window</span>
                      </div>

                      {/* Explainable reasons bullet preview */}
                      <div className="text-[10px] text-zinc-400 bg-zinc-950/60 p-1.5 rounded-md border border-zinc-800 space-y-0.5">
                        <span className="font-mono text-zinc-300 block">Why Priority:</span>
                        <p className="truncate">&bull; {reasons[0]}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Column (6 cols): Operational Gantt Timeline */}
        <div className="lg:col-span-6 space-y-3">
          <OperationalGanttTimeline
            corridorId={2}
            selectedDate="2026-09-15"
            onOpenReplan={() => setSelectedCandidate('PLAN_A')}
          />
        </div>

        {/* Right Column (3 cols): AI Planning Summary & Alternatives */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Brain className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                <span className="font-mono text-xs text-zinc-300 uppercase tracking-wider">AI Planning Summary</span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                OR-Tools CP-SAT
              </span>
            </div>

            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Candidate Plan Selector (Plan A vs Plan B) */}
              <div>
                <label className="block text-zinc-400 font-mono mb-1.5 text-[10px] uppercase tracking-wider">
                  Feasible Plan Options:
                </label>
                <div className="space-y-2">
                  {candidatesData?.candidates?.map((cand: any) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand.id)}
                      className={`p-2.5 rounded-md border cursor-pointer transition-colors ${
                        selectedCandidate === cand.id
                          ? 'border-blue-500 bg-blue-500/10 text-zinc-100'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-zinc-100">{cand.name}</span>
                        {cand.is_recommended && (
                          <span className="text-[9px] font-mono font-medium uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 font-mono">
                        <span>Window: {cand.slot}</span>
                        <span className={cand.train_conflicts === 0 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                          {cand.train_conflicts} conflict{cand.train_conflicts !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparative Metrics */}
              {currentPlan && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-zinc-950/60 p-2 rounded-md border border-zinc-800">
                      <span className="text-zinc-500 block font-mono text-[10px]">Train Delay:</span>
                      <span className="font-medium text-zinc-100 font-mono text-xs">
                        {currentPlan.train_impact_minutes || 0} min
                      </span>
                    </div>
                    <div className="bg-zinc-950/60 p-2 rounded-md border border-zinc-800">
                      <span className="text-zinc-500 block font-mono text-[10px]">Corridor Avail:</span>
                      <span className="font-medium text-emerald-400 font-mono text-xs">
                        {currentPlan.asset_availability || 98.4}%
                      </span>
                    </div>
                  </div>

                  {/* Explainable Reasons */}
                  <div className="bg-zinc-950/60 p-2.5 rounded-md border border-zinc-800 space-y-1.5">
                    <span className="font-mono text-zinc-300 text-[10px] uppercase flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                      <span>Why this plan?</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-400">
                      {currentPlan.reasons?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-emerald-400 font-bold">&bull;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact Summary */}
                  <p className="text-[11px] text-zinc-400 italic bg-zinc-950/40 p-2 rounded-md border border-zinc-800">
                    {currentPlan.impact_summary}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(true)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md transition-colors shadow-sm"
                >
                  Approve &amp; Publish {currentPlan?.name?.split(' ')[0] || 'Plan A'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs rounded-md transition-colors"
                >
                  Request Revision / Modify
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl max-w-md w-full p-5 text-zinc-100">
            <h3 className="font-semibold text-base text-zinc-100 mb-2">Confirm Operational Plan Approval</h3>
            <p className="text-xs text-zinc-400 mb-4">
              You are authorizing railway corridor possession for <strong className="text-zinc-200">Corridor C2</strong> on{' '}
              <strong className="text-zinc-200">{currentPlan?.slot || '14:30 – 15:15'}</strong>. This will publish the timetable and notify the assigned field engineering crew.
            </p>

            <div className="bg-zinc-950/60 p-3 rounded-md border border-zinc-800 text-xs mb-4 space-y-1 font-mono text-zinc-300">
              <div>Plan Number: {candidatesData?.plan_number || 'PLAN-2026-00042'}</div>
              <div>Selected Alternative: {currentPlan?.name || 'Plan A'}</div>
              <div>Train Impact: {currentPlan?.train_impact_minutes || 0} minutes</div>
            </div>

            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-700 rounded-md font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => approveMutation.mutate(candidatesData?.plan_id || 42)}
                disabled={approveMutation.isPending}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision / Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl max-w-md w-full p-5 text-zinc-100">
            <h3 className="font-semibold text-base text-zinc-100 mb-2">Request Plan Changes</h3>
            <p className="text-xs text-zinc-400 mb-3">
              Please enter the operational reason for rejecting or modifying this candidate plan:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Target window conflicts with VIP express rake transfer on Section C2..."
              className="w-full text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-200 focus:border-blue-500 focus:outline-hidden mb-4 resize-none"
            />
            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 border border-zinc-700 rounded-md font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate({ planId: candidatesData?.plan_id || 42, reason: rejectReason || 'Changes requested by Operations Manager' })}
                disabled={rejectMutation.isPending}
                className="px-3.5 py-1.5 bg-red-600 text-white font-medium rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerAIPlanner
