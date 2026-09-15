import React, { useState, useEffect } from 'react'
import {
  fetchTodayWork,
  startWork,
  completeWork,
  uploadEvidence,
  reportExecutionProblem
} from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Clock,
  CheckCircle2,
  Camera,
  Play,
  Check,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Wrench,
  FileCheck,
  X,
  Upload
} from 'lucide-react'

export const FieldExecution: React.FC = () => {
  const { user } = useAuth()
  const [workItems, setWorkItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeItem, setActiveItem] = useState<any | null>(null)

  // Completion modal state
  const [completeModalOpen, setCompleteModalOpen] = useState<boolean>(false)
  const [actualMinutes, setActualMinutes] = useState<number>(115)
  const [completionNote, setCompletionNote] = useState<string>(
    'Rail crack section replaced with 6m rail insert, thermit welded, and ground to tolerance. 130 km/h clearance given.'
  )
  const [issueEncountered, setIssueEncountered] = useState<string>('None. Standard gang operation.')

  // Evidence modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState<boolean>(false)
  const [fileName, setFileName] = useState<string>('track_weld_ultrasonic_pass_c2_02.jpg')
  const [evidenceComments, setEvidenceComments] = useState<string>(
    'Post-weld ultrasonic flaw detector scan passed. Zero internal fissures detected.'
  )
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Problem reporting modal state (Section 26 & 27)
  const [problemModalOpen, setProblemModalOpen] = useState<boolean>(false)
  const [problemCategory, setProblemCategory] = useState<string>('Unexpected damage')
  const [problemDescription, setProblemDescription] = useState<string>(
    'Additional rail crack discovered 2m down-track under fishplate. Current allocated block duration is no longer sufficient.'
  )
  const [isCritical, setIsCritical] = useState<boolean>(true)
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'critical' | 'info'; text: string } | null>(null)

  const handleReportProblem = async () => {
    if (!activeItem) return
    setIsProcessing(true)
    try {
      const res = await reportExecutionProblem(activeItem.assignment_id, {
        issue_category: problemCategory,
        description: problemDescription,
        is_critical: isCritical
      })
      setProblemModalOpen(false)
      setFeedbackBanner({
        type: isCritical ? 'critical' : 'info',
        text: isCritical
          ? `🚨 Critical defect recorded (${res.event_number || 'CE-2026'}). Event broadcasted to Operations Manager. Emergency replanning triggered.`
          : 'Field problem reported to Operations Manager.'
      })
      loadWork()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Failed to report problem')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    loadWork()
  }, [])

  const loadWork = async () => {
    setLoading(true)
    try {
      const data = await fetchTodayWork()
      setWorkItems(data || [])
      if (data && data.length > 0) {
        setActiveItem(data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWork = async (item: any) => {
    setIsProcessing(true)
    try {
      await startWork(item.assignment_id, 'Safety flags placed. Track cutting commenced.')
      loadWork()
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompleteWork = async () => {
    if (!activeItem) return
    setIsProcessing(true)
    try {
      await completeWork(activeItem.assignment_id, {
        actual_duration_minutes: actualMinutes,
        completion_note: completionNote,
        issue_encountered: issueEncountered
      })
      setCompleteModalOpen(false)
      loadWork()
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUploadEvidence = async () => {
    if (!activeItem) return
    setIsProcessing(true)
    try {
      await uploadEvidence(activeItem.assignment_id, {
        file_name: fileName,
        file_type: 'image/jpeg',
        comments: evidenceComments
      })
      setEvidenceModalOpen(false)
      loadWork()
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const allCompleted = workItems.length > 0 && workItems.every((w) => w.status === 'COMPLETED')

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Mobile-Friendly Banner (Section 48) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Field Execution Mode
            </span>
            <span className="text-xs text-slate-400">Inspector: {user?.full_name || 'Manoj Tiwari'}</span>
          </div>
          <h1 className="text-lg font-black text-white mt-1">Today's Assigned Maintenance Possession</h1>
          <p className="text-xs text-slate-400">Corridor C2 • Section C2-02 • Possession Window: 14:00 – 16:30</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Operational Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fade-in ${
            feedbackBanner.type === 'critical'
              ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-sm'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackBanner.type === 'critical' ? (
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* PLAN COMPLETED SUMMARY (Section 36) */}
      {allCompleted && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-900 font-black text-sm uppercase">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>PLAN COMPLETED SUCCESSFULLY</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-400 font-bold block text-[10px]">TASKS COMPLETED</span>
              <span className="font-black text-emerald-800 text-sm">3 / 3 Completed</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-400 font-bold block text-[10px]">SCHEDULED BLOCK</span>
              <span className="font-bold text-slate-800 text-sm">14:00 – 16:30</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-400 font-bold block text-[10px]">ACTUAL EXECUTION</span>
              <span className="font-bold text-slate-800 text-sm">14:02 – 16:15</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <span className="text-slate-400 font-bold block text-[10px]">CORRIDOR STATUS</span>
              <span className="font-bold text-emerald-700 text-sm">Track Cleared</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks Cards */}
      <div className="space-y-4">
        {workItems.map((item) => {
          const isNotStarted = item.status === 'NOT_STARTED'
          const isInProgress = item.status === 'IN_PROGRESS'
          const isDone = item.status === 'COMPLETED'

          return (
            <div
              key={item.record_id}
              className={`p-5 rounded-2xl border transition-all ${
                isInProgress
                  ? 'bg-blue-50/50 border-blue-300 shadow-md ring-2 ring-blue-500/20'
                  : isDone
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-blue-600">
                    {item.department}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {item.reference_no}: {item.task_description}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.location}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase self-start sm:self-center ${
                  isInProgress
                    ? 'bg-blue-600 text-white animate-pulse'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Instructions list */}
              <div className="py-3 text-xs space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  Site Execution Instructions:
                </span>
                <ul className="space-y-1 text-slate-700 font-medium">
                  {item.instructions?.map((inst: string, i: number) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons (Section 34) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {item.started_at && (
                    <span>Started: <strong className="text-slate-800">{new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  )}
                  {item.completed_at && (
                    <span className="ml-3">Completed: <strong className="text-emerald-700">{new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isNotStarted && (
                    <button
                      onClick={() => handleStartWork(item)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>START WORK</span>
                    </button>
                  )}

                  {isInProgress && (
                    <>
                      <button
                        onClick={() => {
                          setActiveItem(item)
                          setEvidenceModalOpen(true)
                        }}
                        className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload Photo ({item.evidence_count || 0})</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveItem(item)
                          setProblemModalOpen(true)
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                        <span>REPORT PROBLEM</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveItem(item)
                          setCompleteModalOpen(true)
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>COMPLETE WORK</span>
                      </button>
                    </>
                  )}

                  {item.status === 'BLOCKED' && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span>BLOCKED: Problem reported. Awaiting Operations Manager replan.</span>
                    </div>
                  )}

                  {isDone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-700">✓ Completed ({item.actual_duration_minutes}m)</span>
                      <button
                        onClick={() => {
                          setActiveItem(item)
                          setEvidenceModalOpen(true)
                        }}
                        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
                      >
                        View Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* COMPLETE WORK MODAL (Section 34) */}
      {completeModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Complete Maintenance Task</h3>
                <p className="text-xs text-slate-500">{activeItem.task_description}</p>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Actual Duration (Minutes)</label>
                <input
                  type="number"
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Completion Note</label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Record rail temperature, weld inspection result, and track clearance"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Issues Encountered (if any)</label>
                <input
                  type="text"
                  value={issueEncountered}
                  onChange={(e) => setIssueEncountered(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWork}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                CONFIRM COMPLETION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL (Section 35) */}
      {evidenceModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Upload Inspection Photo / Evidence</h3>
                <p className="text-xs text-slate-500">Record site verification photograph</p>
              </div>
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50 text-center space-y-2">
                <Camera className="w-8 h-8 text-blue-600 mx-auto" />
                <div className="font-bold text-blue-900">{fileName}</div>
                <p className="text-[11px] text-blue-700">Simulated mobile camera snapshot attached</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inspector Comments</label>
                <textarea
                  rows={2}
                  value={evidenceComments}
                  onChange={(e) => setEvidenceComments(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  placeholder="Notes on ultrasonic test, visual alignment, and safety clearance"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadEvidence}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                SAVE EVIDENCE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT PROBLEM / BLOCKER MODAL (Section 26 & 27) */}
      {problemModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Report In-Field Problem</h3>
                  <p className="text-xs text-slate-500">Log unexpected damage, delay, or safety concern</p>
                </div>
              </div>
              <button
                onClick={() => setProblemModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Problem Category</label>
                <select
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-800 font-medium"
                >
                  <option value="Unexpected damage">Unexpected damage</option>
                  <option value="Required work is larger than expected">Required work is larger than expected</option>
                  <option value="Equipment unavailable">Equipment unavailable</option>
                  <option value="Access blocked">Access blocked</option>
                  <option value="Safety concern">Safety concern</option>
                  <option value="Additional defect">Additional defect</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  placeholder="Describe the condition, location, and why work is impeded..."
                />
              </div>

              {/* Critical Escalation Switch (Section 27) */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="critical-replan-toggle"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="critical-replan-toggle" className="cursor-pointer">
                  <span className="font-extrabold text-rose-900 block">
                    Escalate to Operations Manager as CRITICAL
                  </span>
                  <span className="text-rose-700 block text-[11px] leading-relaxed mt-0.5">
                    Immediately creates a Critical Event entity, alerts connected Operations Managers via central event bus, and triggers AI Dynamic Replanning for Corridor C2.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setProblemModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReportProblem}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isCritical ? 'SUBMIT CRITICAL ALERT' : 'SUBMIT REPORT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default FieldExecution
