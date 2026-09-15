import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  fetchTasks,
  fetchUsers,
  approveTask,
  rejectTask,
  clarifyTask,
  assignTask
} from '../../services/api'
import { EmptyState } from '../../components/common/EmptyState'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Camera,
  FileText,
  Train,
  Check,
  X,
  MessageSquare,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

export const ManagerIssueApproval: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [engineers, setEngineers] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalType, setModalType] = useState<'APPROVE' | 'REJECT' | 'CLARIFY' | 'ASSIGN' | null>(null)
  const [inputNote, setInputNote] = useState('')
  const [selectedEngineerId, setSelectedEngineerId] = useState<number | ''>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetchTasks({ scope: 'approvals', page_size: 100 }),
        fetchUsers({ role: 'MAINTENANCE_ENGINEER' }).catch(() => ({ items: [] }))
      ])
      const pending = (tasksRes?.items || []).filter(
        (t: any) => ['NEW', 'SUBMITTED', 'UNDER_REVIEW', 'PRIORITIZED'].includes(t.status)
      )
      setTasks(pending)
      if (pending.length > 0 && !selectedTask) {
        setSelectedTask(pending[0])
      } else if (pending.length === 0) {
        setSelectedTask(null)
      }
      setEngineers(usersRes?.items || [])
    } catch (err) {
      console.error('Failed to load approval tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleActionSubmit = async () => {
    if (!selectedTask || !modalType) return
    setActionLoading(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      if (modalType === 'APPROVE') {
        await approveTask(selectedTask.task_id, {
          comments: inputNote || 'Approved for corridor maintenance work.',
          assigned_to_user_id: selectedEngineerId ? Number(selectedEngineerId) : undefined
        })
        setActionSuccess(`Issue ${selectedTask.reference_no} APPROVED successfully.`)
      } else if (modalType === 'REJECT') {
        if (!inputNote.trim()) {
          setActionError('Rejection reason is mandatory.')
          setActionLoading(false)
          return
        }
        await rejectTask(selectedTask.task_id, { reason: inputNote })
        setActionSuccess(`Issue ${selectedTask.reference_no} REJECTED.`)
      } else if (modalType === 'CLARIFY') {
        if (!inputNote.trim()) {
          setActionError('Clarification questions are required.')
          setActionLoading(false)
          return
        }
        await clarifyTask(selectedTask.task_id, { comments: inputNote })
        setActionSuccess(`Clarification requested on ${selectedTask.reference_no}.`)
      } else if (modalType === 'ASSIGN') {
        if (!selectedEngineerId) {
          setActionError('Please select a maintenance engineer.')
          setActionLoading(false)
          return
        }
        await assignTask(selectedTask.task_id, {
          assigned_to_user_id: Number(selectedEngineerId),
          instructions: inputNote || 'Assigned for immediate field execution.'
        })
        setActionSuccess(`Work assigned to engineer for ${selectedTask.reference_no}.`)
      }

      setModalType(null)
      setInputNote('')
      setSelectedEngineerId('')
      await loadData()
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || 'Action failed. Please verify authorization.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Formal Verification & Work Order Dispatch</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Issue Approval & Assignment</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Decide on incoming field inspection reports: Approve, Reject, Request Clarification, or Dispatch Work Orders
          </p>
        </div>

        <div className="text-xs text-slate-300 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
          Pending Review: <strong className="text-blue-400 font-mono text-sm">{tasks.length}</strong>
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
          <XCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-bold">{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading issues awaiting approval...</div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No issues awaiting approval"
          description="All submitted track defects and maintenance requests have been reviewed."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of items (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">
              Select Issue to Review
            </h2>
            <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isSelected = selectedTask?.task_id === task.task_id
                return (
                  <div
                    key={task.task_id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-900/30 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-black text-blue-400">
                        {task.reference_no || `TASK-${task.task_id}`}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        task.severity >= 4 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        Sev {task.severity || 3} • {task.department || 'TRACK'}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      {task.defect_type || task.description}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{task.location_name || 'Section C2-02'} (Track {task.track || '2'})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Detailed Review & Action Center (7 cols) */}
          {selectedTask && (
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Header Info */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-black text-blue-400">
                      {selectedTask.reference_no || `TASK-${selectedTask.task_id}`}
                    </span>
                    <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedTask.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Reported by: <strong className="text-white">{selectedTask.created_user_name || 'Inspector'}</strong>
                  </div>
                </div>

                <h2 className="text-base font-black text-white">
                  {selectedTask.defect_type || selectedTask.description}
                </h2>
              </div>

              {/* Operational Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Location</div>
                  <div className="font-bold text-white mt-0.5">{selectedTask.location_name || 'KM 142/6 Salem–Erode'}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Track / Line</div>
                  <div className="font-bold text-blue-400 mt-0.5">Track {selectedTask.track || '2 (Down Line)'}</div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase">Severity / Urgency</div>
                  <div className="font-bold text-red-400 mt-0.5">Level {selectedTask.severity || 3} of 5</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Field Findings</div>
                <p className="text-xs text-slate-200 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              {/* Timetable / Operational Impact */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-1 text-amber-200">
                <div className="font-bold flex items-center space-x-1.5">
                  <Train className="w-4 h-4 text-amber-400" />
                  <span>Timetable & Corridor Impact Assessment</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Approval triggers track possession during scheduled window 14:00–16:30. Trains 12675 and 20643 will run on Track 1 without speed restriction.
                </p>
              </div>

              {/* 4 Primary Operational Actions (Requirement 8) */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">Manager Decision</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* APPROVE */}
                  <button
                    onClick={() => setModalType('APPROVE')}
                    className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>APPROVE</span>
                  </button>

                  {/* REJECT */}
                  <button
                    onClick={() => setModalType('REJECT')}
                    className="py-3 px-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-black transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
                  >
                    <X className="w-4 h-4" />
                    <span>REJECT</span>
                  </button>

                  {/* CLARIFY */}
                  <button
                    onClick={() => setModalType('CLARIFY')}
                    className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>CLARIFY</span>
                  </button>

                  {/* ASSIGN */}
                  <button
                    onClick={() => setModalType('ASSIGN')}
                    className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all flex items-center justify-center space-x-1.5 min-h-[44px]"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>ASSIGN</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {modalType === 'APPROVE' && 'Approve Maintenance Work Order'}
                {modalType === 'REJECT' && 'Reject Issue Report'}
                {modalType === 'CLARIFY' && 'Request Inspector Clarification'}
                {modalType === 'ASSIGN' && 'Assign Maintenance Engineer'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(modalType === 'APPROVE' || modalType === 'ASSIGN') && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assign to Maintenance Engineer</label>
                  <select
                    value={selectedEngineerId}
                    onChange={(e) => setSelectedEngineerId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="">-- Choose Engineer --</option>
                    {engineers.map((eng) => (
                      <option key={eng.user_id} value={eng.user_id}>
                        {eng.full_name} ({eng.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {modalType === 'REJECT' ? 'Reason for Rejection *' : 'Operational Instructions / Notes'}
                </label>
                <textarea
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  rows={3}
                  required={modalType === 'REJECT' || modalType === 'CLARIFY'}
                  placeholder={
                    modalType === 'APPROVE'
                      ? 'e.g. Approved. Possession granted for welding.'
                      : modalType === 'REJECT'
                      ? 'e.g. Duplicate defect report or non-critical cosmetic wear.'
                      : modalType === 'CLARIFY'
                      ? 'e.g. Please specify exact ultrasonic probe reading and rail temperature.'
                      : 'e.g. Mobilize welding gang by 14:00 at KM 142/6.'
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs min-h-[44px] flex items-center justify-center space-x-1"
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerIssueApproval
