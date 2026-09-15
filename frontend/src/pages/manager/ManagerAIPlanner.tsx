import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain, CheckCircle2, AlertTriangle, ShieldCheck, Clock,
  ArrowRight, FileText, ChevronRight, Zap, RefreshCw, XCircle, Info
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
        // Return structured default candidate comparison
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
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Maintenance Planner</h1>
            <span className="px-2 py-0.5 rounded bg-rail-maroon text-white font-bold text-[10px] uppercase tracking-wider">
              Operations Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize maintenance block schedules, analyze train timetable conflicts, and publish authorized possessions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => refetchCandidates()}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-evaluate Schedule</span>
          </button>
          <button
            type="button"
            onClick={() => setApprovalModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rail-maroon hover:bg-rail-maroon-dark text-white rounded text-xs font-bold transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Publish Plan</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {publishSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{publishSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setPublishSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main 3-Column Workspace (Part 33) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (3 cols): Maintenance Tasks with Explainable Priority */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Maintenance Tasks ({tasks.length || 3})
              </span>
              <span className="text-[10px] text-slate-500 font-medium">AI Prioritized</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">No active maintenance tasks.</div>
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
                      className="p-3 hover:bg-slate-50/80 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">{refNo}</span>
                        <PriorityBadge level={pLevel} />
                      </div>

                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {t.description || 'Ultrasonic weld test and rail surface grinding'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{t.department || 'Engineering/Track'}</span>
                        <span className="font-mono">{t.estimated_duration || 45}m window</span>
                      </div>

                      {/* Explainable reasons bullet preview */}
                      <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200/80 space-y-0.5">
                        <span className="font-bold text-slate-700 block">Why Priority:</span>
                        <p className="truncate">• {reasons[0]}</p>
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
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Brain className="w-4 h-4 text-rail-maroon" />
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">AI Planning Summary</span>
              </div>
              <span className="text-[10px] font-bold text-rail-maroon bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                OR-Tools CP-SAT
              </span>
            </div>

            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Candidate Plan Selector (Plan A vs Plan B) */}
              <div>
                <label className="block text-slate-600 font-bold mb-1.5 text-[11px] uppercase tracking-wider">
                  Feasible Plan Options:
                </label>
                <div className="space-y-2">
                  {candidatesData?.candidates?.map((cand: any) => (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        selectedCandidate === cand.id
                          ? 'border-rail-maroon bg-rose-50/40 ring-1 ring-rail-maroon shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{cand.name}</span>
                        {cand.is_recommended && (
                          <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 font-mono">
                        <span>Window: {cand.slot}</span>
                        <span className={cand.train_conflicts === 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {cand.train_conflicts} train conflict{cand.train_conflicts !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comparative Metrics */}
              {currentPlan && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Train Delay:</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {currentPlan.train_impact_minutes || 0} min
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Corridor Avail:</span>
                      <span className="font-bold text-emerald-700 font-mono text-xs">
                        {currentPlan.asset_availability || 98.4}%
                      </span>
                    </div>
                  </div>

                  {/* Explainable Reasons ("Why this plan?") */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center space-x-1">
                      <Info className="w-3.5 h-3.5 text-rail-maroon" />
                      <span>Why this plan?</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {currentPlan.reasons?.map((r: string, idx: number) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact Summary */}
                  <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-2 rounded border border-amber-200">
                    {currentPlan.impact_summary}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(true)}
                  className="w-full py-2 bg-rail-maroon hover:bg-rail-maroon-dark text-white font-bold text-xs rounded transition-colors shadow-xs"
                >
                  Approve & Publish {currentPlan?.name?.split(' ')[0] || 'Plan A'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 text-slate-800">
            <h3 className="font-bold text-base text-slate-900 mb-2">Confirm Operational Plan Approval</h3>
            <p className="text-xs text-slate-600 mb-4">
              You are authorizing railway corridor possession for <strong>Corridor C2</strong> on{' '}
              <strong>{currentPlan?.slot || '14:30 – 15:15'}</strong>. This will publish the timetable and notify the assigned field engineering crew.
            </p>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs mb-4 space-y-1 font-mono">
              <div>Plan Number: {candidatesData?.plan_number || 'PLAN-2026-00042'}</div>
              <div>Selected Alternative: {currentPlan?.name || 'Plan A'}</div>
              <div>Train Impact: {currentPlan?.train_impact_minutes || 0} minutes</div>
            </div>

            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => approveMutation.mutate(candidatesData?.plan_id || 42)}
                disabled={approveMutation.isPending}
                className="px-3.5 py-1.5 bg-rail-maroon text-white font-bold rounded hover:bg-rail-maroon-dark disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision / Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 text-slate-800">
            <h3 className="font-bold text-base text-slate-900 mb-2">Request Plan Changes</h3>
            <p className="text-xs text-slate-600 mb-3">
              Please enter the operational reason for rejecting or modifying this candidate plan:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Target window conflicts with VIP express rake transfer on Section C2..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-rail-maroon focus:outline-none mb-4"
            />
            <div className="flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate({ planId: candidatesData?.plan_id || 42, reason: rejectReason || 'Changes requested by Operations Manager' })}
                disabled={rejectMutation.isPending}
                className="px-3.5 py-1.5 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 disabled:opacity-50"
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
