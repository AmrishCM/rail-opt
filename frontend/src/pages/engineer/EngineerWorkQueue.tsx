import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  startTaskWork,
  resolveTaskWork
} from '../../services/api'
import { OperationalTable, Column } from '../../components/common/OperationalTable'
import {
  Wrench,
  Clock,
  Play,
  CheckCircle2,
  Camera,
  AlertTriangle,
  MapPin,
  X,
  FileCheck,
  Check
} from 'lucide-react'

export interface EngineerWorkQueueProps {
  initialFilter?: 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
}

export const EngineerWorkQueue: React.FC<EngineerWorkQueueProps> = ({ initialFilter = 'ALL' }) => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>(initialFilter)
  const [resolveModalTask, setResolveModalTask] = useState<any | null>(null)
  const [reportProblemTask, setReportProblemTask] = useState<any | null>(null)
  const [problemCategory, setProblemCategory] = useState('Unexpected damage')
  const [problemDescription, setProblemDescription] = useState('')
  const [problemDuration, setProblemDuration] = useState(35)
  const [problemLocation, setProblemLocation] = useState('Section C2 (KM 42.8)')
  const [replanApprovedNotice, setReplanApprovedNotice] = useState<any | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [completionNotes, setCompletionNotes] = useState('')
  const [photoEvidence, setPhotoEvidence] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleReportProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportProblemTask) return
    if (!problemDescription.trim()) {
      setActionError('Problem description is required.')
      return
    }

    setSubmitting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const assignmentId = reportProblemTask.assignment_id || reportProblemTask.task_id || 1
      const res = await (await import('../../services/api')).apiClient.post(`/execution/${assignmentId}/report-problem`, {
        issue_category: problemCategory,
        description: problemDescription,
        is_critical: true,
        additional_duration_minutes: Number(problemDuration),
        current_location: problemLocation
      })
      setActionSuccess(
        `Work issue reported (+${problemDuration} min requested). Operations Manager notified for AI Replan.`
      )
      setReportProblemTask(null)
      setProblemDescription('')
      await loadTasks()
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to report work issue.')
    } finally {
      setSubmitting(false)
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetchTasks({ assigned_to_me: true, page_size: 100 })
      setTasks(res?.items || [])
    } catch (err) {
      console.error('Failed to load engineer work queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [user])

  const handleStartWork = async (taskId: number) => {
    setActionError(null)
    setActionSuccess(null)
    try {
      await startTaskWork(taskId, { notes: 'Field maintenance gang mobilized on site.' })
      setActionSuccess('Work started. Status updated to IN PROGRESS.')
      await loadTasks()
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to start work.')
    }
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoEvidence(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolveModalTask) return
    if (!completionNotes.trim()) {
      setActionError('Completion notes are required.')
      return
    }

    setSubmitting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      await resolveTaskWork(resolveModalTask.task_id, {
        actual_duration_minutes: Number(durationMinutes),
        completion_notes: completionNotes,
        photo_evidence: photoEvidence || undefined
      })
      setActionSuccess(`Issue ${resolveModalTask.reference_no} marked RESOLVED. Awaiting manager verification.`)
      setResolveModalTask(null)
      setCompletionNotes('')
      setPhotoEvidence(null)
      await loadTasks()
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Failed to resolve work order.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'PENDING') return ['APPROVED', 'SCHEDULED', 'ASSIGNED', 'REPLANNED'].includes(t.status)
    if (filter === 'IN_PROGRESS') return ['IN_PROGRESS', 'DELAY_REQUESTED', 'REPLAN_REQUESTED', 'AI_REPLANNING'].includes(t.status)
    if (filter === 'COMPLETED') return ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(t.status)
    return true
  })

  const columns: Column<any>[] = [
    {
      key: 'reference_no',
      header: 'Issue ID',
      priority: 'essential',
      render: (t) => (
        <span className="font-mono font-black text-amber-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
      )
    },
    {
      key: 'defect_type',
      header: 'Work Requirement',
      priority: 'essential',
      render: (t) => (
        <div className="space-y-0.5">
          <div className="font-bold text-white text-xs">{t.defect_type || t.description?.slice(0, 35)}</div>
          <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
        </div>
      )
    },
    {
      key: 'location_name',
      header: 'Location / Track',
      priority: 'medium',
      render: (t) => (
        <div className="text-xs">
          <div className="text-slate-200 font-semibold">{t.location_name || 'Section C2-02'}</div>
          <div className="text-[10px] text-slate-400">Track {t.track || '2'}</div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Priority',
      priority: 'medium',
      render: (t) => (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
          t.severity >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          Sev {t.severity || 3}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Work Status',
      priority: 'essential',
      render: (t) => (
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
          t.status === 'IN_PROGRESS'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : t.status === 'RESOLVED' || t.status === 'CLOSED'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {t.status?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Field Action',
      priority: 'essential',
      render: (t) => {
        if (['APPROVED', 'SCHEDULED', 'ASSIGNED', 'REPLANNED'].includes(t.status)) {
          return (
            <button
              onClick={() => handleStartWork(t.task_id)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors min-h-[36px]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Work</span>
            </button>
          )
        }
        if (t.status === 'IN_PROGRESS') {
          return (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => {
                  setResolveModalTask(t)
                  setCompletionNotes('')
                  setPhotoEvidence(null)
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors min-h-[36px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>
              <button
                onClick={() => {
                  setReportProblemTask(t)
                  setProblemLocation(t.location_name || 'Section C2 (KM 42.8)')
                  setProblemDescription('')
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition-colors min-h-[36px]"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>[ Report Work Issue ]</span>
              </button>
            </div>
          )
        }
        if (['DELAY_REQUESTED', 'REPLAN_REQUESTED', 'AI_REPLANNING'].includes(t.status)) {
          return (
            <span className="text-[11px] text-amber-400 font-bold flex items-center space-x-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Pending Replan Approval</span>
            </span>
          )
        }
        return (
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        )
      }
    }
  ]

  const renderMobileCard = (t: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-black text-amber-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
          t.status === 'IN_PROGRESS'
            ? 'bg-amber-500/20 text-amber-300'
            : t.status === 'RESOLVED' || t.status === 'CLOSED'
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {t.status?.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-bold text-white text-xs">{t.defect_type || t.description}</p>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span>{t.location_name || 'Salem–Erode'} • Track {t.track || '2'}</span>
          <span>•</span>
          <span className="text-amber-400 font-semibold">Sev {t.severity || 3}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <Link
          to={`/tasks/${t.task_id}`}
          className="text-xs text-slate-400 hover:text-white font-bold"
        >
          View Details
        </Link>

        {t.status === 'APPROVED' || t.status === 'SCHEDULED' ? (
          <button
            onClick={() => handleStartWork(t.task_id)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs min-h-[44px] flex items-center space-x-1"
          >
            <Play className="w-4 h-4" />
            <span>Start Work</span>
          </button>
        ) : t.status === 'IN_PROGRESS' ? (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setReportProblemTask(t)
                setProblemLocation(t.location_name || 'Section C2 (KM 42.8)')
                setProblemDescription('')
              }}
              className="px-3 py-2 rounded-xl bg-amber-600 text-white font-black text-xs min-h-[44px] flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
            <button
              onClick={() => setResolveModalTask(t)}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs min-h-[44px] flex items-center space-x-1"
            >
              <Check className="w-4 h-4" />
              <span>Complete</span>
            </button>
          </div>
        ) : (
          <span className="text-xs text-emerald-400 font-bold">Resolved</span>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4" />
            <span>Field Maintenance Work Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Maintenance Work Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log possession start times, track work completion, and upload repair evidence
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] ${
                filter === f.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-bold">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 flex items-center space-x-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-bold">{actionError}</span>
        </div>
      )}

      {/* Operational Table */}
      <OperationalTable
        data={filteredTasks}
        columns={columns}
        keyExtractor={(t) => t.task_id}
        renderMobileCard={renderMobileCard}
        isLoading={loading}
        emptyTitle="No work items"
        emptyDescription="No maintenance work orders found matching your criteria."
      />

      {/* Resolve / Completion Dialog Modal */}
      {resolveModalTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleResolveSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Complete Work Order
                </span>
                <h3 className="text-sm font-black text-white mt-0.5">
                  {resolveModalTask.reference_no || `TASK-${resolveModalTask.task_id}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Actual Duration (Minutes) *</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Work Completion Notes *</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g. Thermit weld executed, rail grinding done, track gauge tested, cleared for 30 km/h..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Photo Evidence / Clearance Photo</label>
                <label className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer text-xs font-bold min-h-[44px]">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </label>
                {photoEvidence && (
                  <span className="text-emerald-400 text-xs font-bold ml-2">Image Selected</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setResolveModalTask(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs min-h-[44px] flex items-center justify-center space-x-1"
              >
                {submitting ? 'Recording...' : 'Submit & Resolve'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Problem / Interruption Modal (Part 9) */}
      {reportProblemTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleReportProblemSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Report Work Issue & Request Replan</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportProblemTask(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-associated Work Order Metadata (Part 9) */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Work Order:</span>
                <span className="text-amber-400 font-bold">
                  {reportProblemTask.reference_no || `WO-${reportProblemTask.task_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Engineer:</span>
                <span className="text-slate-200">{user?.full_name || 'Engineer Arun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Window:</span>
                <span className="text-slate-200">14:30 → 15:15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Track / Section:</span>
                <span className="text-slate-200">Section C2</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Issue Category *</label>
                <select
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Unexpected damage">Unexpected damage</option>
                  <option value="Required part unavailable">Required part unavailable</option>
                  <option value="Additional repair required">Additional repair required</option>
                  <option value="Access blocked">Access blocked</option>
                  <option value="Safety concern">Safety concern</option>
                  <option value="Work taking longer than estimated">Work taking longer than estimated</option>
                  <option value="Equipment failure">Equipment failure</option>
                  <option value="Track unavailable">Track unavailable</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detailed Problem Description *</label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  required
                  placeholder="e.g. Replacement switch motor armature unavailable from depot. Requires 35 additional minutes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Estimated Extra (min) *</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={problemDuration}
                    onChange={(e) => setProblemDuration(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Location</label>
                  <input
                    type="text"
                    value={problemLocation}
                    onChange={(e) => setProblemLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setReportProblemTask(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs min-h-[44px]"
              >
                {submitting ? 'Submitting...' : 'Submit Issue & Replan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default EngineerWorkQueue
