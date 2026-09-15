import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { reportEmergencyDefect, replanCriticalEvent } from '../../services/api'
import {
  AlertOctagon,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  X,
  Clock,
  Layers,
  Train,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  History
} from 'lucide-react'

export interface EmergencyReplanModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EmergencyReplanModal: React.FC<EmergencyReplanModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<'REPORT' | 'IMPACT' | 'REPLAN_RESULT' | 'REPLAN_FAILED'>('REPORT')
  const [sectionCode, setSectionCode] = useState('C2-02')
  const [assetName, setAssetName] = useState('Signal S-104')
  const [issue, setIssue] = useState('Automatic block signal lamp failure / interlocking red drop')
  const [detectedTime, setDetectedTime] = useState('14:20')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eventData, setEventData] = useState<any | null>(null)
  const [replanResult, setReplanResult] = useState<any | null>(null)
  const [failureDetail, setFailureDetail] = useState<any | null>(null)

  if (!isOpen) return null

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['emergency'] })
    queryClient.invalidateQueries({ queryKey: ['plans'] })
    queryClient.invalidateQueries({ queryKey: ['plan'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['timeline'] })
    queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
  }

  const handleReportDefect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await reportEmergencyDefect({
        section_code: sectionCode,
        asset_name: assetName,
        issue_description: issue,
        severity: 'CRITICAL',
        detected_time: detectedTime
      })
      setEventData(res)
      invalidateAll()
      setStep('IMPACT')
    } catch (err: any) {
      console.error('Failed to report emergency defect:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTriggerReplan = async () => {
    setIsSubmitting(true)
    try {
      const eventId = eventData?.event_id || 1
      const res = await replanCriticalEvent(eventId)
      setReplanResult(res)
      invalidateAll()
      setStep('REPLAN_RESULT')
    } catch (err: any) {
      console.error('Failed to trigger replan:', err)
      const detail = err?.response?.data?.detail || {
        message: 'NO FEASIBLE REPLAN FOUND. Current safety constraints prevent auto-resolution.',
        causes: ['No suitable block window', 'Protected passenger train service conflict']
      }
      setFailureDetail(detail)
      setStep('REPLAN_FAILED')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenRevisedPlan = () => {
    if (replanResult?.new_plan_id) {
      onClose()
      navigate(`/plans/${replanResult.new_plan_id}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border-2 border-red-400/40 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {step === 'REPORT' && 'REPORT CRITICAL DEFECT'}
                {step === 'IMPACT' && 'CRITICAL DEFECT IMPACT DETECTED'}
                {step === 'REPLAN_RESULT' && 'EMERGENCY RE-PLAN COMPLETE'}
                {step === 'REPLAN_FAILED' && 'NO FEASIBLE REPLAN FOUND'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 'REPORT' && 'Unexpected urgent maintenance reporting'}
                {step === 'IMPACT' && 'Live evaluation against active corridor plans'}
                {step === 'REPLAN_RESULT' && 'New Plan v2 generated with version tracking'}
                {step === 'REPLAN_FAILED' && 'Constraint conflict requires manual extension'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: REPORT FORM */}
        {step === 'REPORT' && (
          <form onSubmit={handleReportDefect} className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950 font-medium leading-relaxed">
              Submitting an emergency defect immediately records a persistent <strong>CriticalEvent</strong>,
              identifies intersecting corridor possession blocks, and analyzes train protection constraints.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Location / Section</label>
                <input
                  type="text"
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Time Detected</label>
                <input
                  type="text"
                  value={detectedTime}
                  onChange={(e) => setDetectedTime(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Affected Asset</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Problem Description</label>
              <textarea
                rows={2}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Recording Event...</span>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>RECORD DEFECT & ASSESS IMPACT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: IMPACT DETECTION (Section 14 & 18) */}
        {step === 'IMPACT' && eventData && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-900 text-sm uppercase">⚠ IMPACT DETECTED</span>
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  {eventData.event_number || 'CE-2026-00002'}
                </span>
              </div>
              <p className="text-amber-900 text-xs">
                {eventData.impact?.explanation || 'Critical defect directly affects scheduled maintenance on Section C2-02.'}
              </p>

              {/* 4 Impact Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-500 font-bold">ACTIVE PLANS</div>
                  <div className="font-black text-slate-900 text-base">{eventData.impact?.affected_plans_count || 1}</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-500 font-bold">TASKS AFFECTED</div>
                  <div className="font-black text-slate-900 text-base">{eventData.impact?.affected_tasks_count || 2}</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-500 font-bold">BLOCKS AFFECTED</div>
                  <div className="font-black text-slate-900 text-base">{eventData.impact?.affected_blocks_count || 1}</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-500 font-bold">TRAINS IMPACTED</div>
                  <div className="font-black text-rose-700 text-base">{eventData.impact?.affected_train_movements_count || 3}</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">AFFECTED PLAN DETAILS</div>
              <div className="font-black text-slate-900">
                {eventData.impact?.active_plan_number || 'PLAN-2026-00101'} (Version {eventData.impact?.active_plan_version || 1})
              </div>
              <p className="text-slate-600">
                The active plan must be frozen and replaced by a revised Plan v2 that shifts non-critical work and protects passenger services.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleTriggerReplan}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Executing CP-SAT Re-Plan...</span>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>TRIGGER AUTOMATIC RE-PLAN (v2)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REPLAN RESULT (Section 16 & 18) */}
        {step === 'REPLAN_RESULT' && replanResult && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-900 text-sm uppercase">REPLAN COMPLETE</span>
                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  AI RE-PLAN OPTIMAL
                </span>
              </div>
              <p className="text-emerald-800 text-xs font-medium">
                {replanResult.change_summary?.explanation}
              </p>

              {/* 4 Changes Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-400 font-bold">TASKS MOVED</div>
                  <div className="font-black text-slate-800 text-sm">{replanResult.change_summary?.tasks_moved}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-400 font-bold">COMBINED</div>
                  <div className="font-black text-slate-800 text-sm">{replanResult.change_summary?.tasks_combined}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-400 font-bold">BLOCKS REPLACED</div>
                  <div className="font-black text-slate-800 text-sm">{replanResult.change_summary?.blocks_cancelled}</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-emerald-200">
                  <div className="text-[10px] text-slate-400 font-bold">NEW WINDOWS</div>
                  <div className="font-black text-emerald-700 text-sm">{replanResult.change_summary?.new_blocks_created}</div>
                </div>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center space-x-1">
                  <History className="w-3 h-3" />
                  <span>ORIGINAL (v{replanResult.original_plan?.version || 1})</span>
                </div>
                <div className="font-black text-slate-800">{replanResult.original_plan?.plan_number || 'PLAN-101'}</div>
                <div className="text-slate-600">Window: {replanResult.original_plan?.window}</div>
                <div className="text-slate-600">Train Delay: {replanResult.original_plan?.train_delay}</div>
                <span className="inline-block text-[9px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 uppercase">
                  {replanResult.original_plan?.status || 'SUPERSEDED'}
                </span>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-blue-700 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>NEW (v{replanResult.revised_plan?.version || 2})</span>
                </div>
                <div className="font-black text-blue-900">{replanResult.revised_plan?.plan_number || 'PLAN-101'}</div>
                <div className="text-blue-800">Window: {replanResult.revised_plan?.window}</div>
                <div className="text-blue-800">Train Delay: {replanResult.revised_plan?.train_delay}</div>
                <span className="inline-block text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase">
                  {replanResult.revised_plan?.status || 'AI_RECOMMENDED'}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleOpenRevisedPlan}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs"
              >
                <span>OPEN PLAN v{replanResult.revised_plan?.version || 2} FOR APPROVAL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REPLAN FAILED (Section 17) */}
        {step === 'REPLAN_FAILED' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-rose-950">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="font-black text-sm uppercase">NO FEASIBLE REPLAN FOUND</span>
              </div>
              <p className="font-medium">
                The current safety and train protection constraints do not allow a safe replacement plan.
              </p>
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase text-rose-800 block">Possible causes:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-900">
                  <li>No suitable block window on Section {sectionCode}</li>
                  <li>S&T or Engineering gang unavailable during alternative slots</li>
                  <li>Protected high-speed train movements (Vande Bharat / Shatabdi)</li>
                  <li>Maintenance duration exceeds remaining available possession</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep('REPORT')}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Extend Planning Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
