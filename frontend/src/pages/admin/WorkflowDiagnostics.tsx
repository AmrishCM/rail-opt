import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchWorkflowDiagnostics,
  fetchRequestTrace,
  resetDemoScenario,
  fetchTasks
} from '../../services/api'
import {
  Database,
  Activity,
  Layers,
  Wrench,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Search
} from 'lucide-react'

export const WorkflowDiagnostics: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedRequestId, setSelectedRequestId] = useState<number | undefined>(undefined)
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const { data: diag, isLoading, refetch } = useQuery({
    queryKey: ['diagnostics', selectedRequestId],
    queryFn: () => fetchWorkflowDiagnostics(selectedRequestId),
    refetchInterval: 15000
  })

  const { data: taskList } = useQuery({
    queryKey: ['tasks-list-diagnostics'],
    queryFn: () => fetchTasks({ page_size: 50 })
  })

  const { data: traceData } = useQuery({
    queryKey: ['request-trace', selectedRequestId || diag?.selected_request?.task_id],
    queryFn: () => fetchRequestTrace(selectedRequestId || diag?.selected_request?.task_id || 1001),
    enabled: Boolean(selectedRequestId || diag?.selected_request?.task_id)
  })

  const handleResetDemo = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to RESET DEMO DATA?\n\nThis will remove all created requests and reset the database deterministically to the clean SIH 2026 baseline state.'
    )
    if (!confirmed) return

    setIsResetting(true)
    try {
      const res = await resetDemoScenario()
      setResetMessage('Database deterministically reset to SIH initial state.')
      queryClient.invalidateQueries()
      refetch()
    } catch (e: any) {
      console.error('Failed to reset demo:', e)
      setResetMessage('Error resetting demo database.')
    } finally {
      setIsResetting(false)
    }
  }

  const req = diag?.selected_request

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Workflow Diagnostics
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
              Admin & Developer Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time authoritative database state verification, entity relationship auditor & trace inspector.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh database diagnostics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting Database...' : 'RESET DEMO DATA'}</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>✓ {resetMessage}</span>
          <button onClick={() => setResetMessage(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Database State Card (Section 3 & 4) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-black text-slate-900 uppercase flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-slate-700" />
            <span>AUTHORITATIVE DATABASE STATE</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Last updated: {diag?.last_updated ? new Date(diag.last_updated).toLocaleString() : 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Connection Status</span>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${diag?.database?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="font-extrabold text-sm text-slate-900">
                {diag?.database?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              Latency: {diag?.database?.latency_ms || 0} ms
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Database Engine</span>
            <div className="font-extrabold text-sm text-slate-900">
              {diag?.database?.type?.toUpperCase() || 'SQLITE'}
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${
              diag?.database?.type === 'postgresql' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {diag?.database?.mode || 'SQLite Development Mode'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Latest Incident</span>
            <div className="font-bold text-xs text-slate-800 truncate">
              {diag?.latest_event?.event_number || 'None'}
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {diag?.latest_event?.description || 'Clean operations'}
            </p>
          </div>
        </div>
      </div>

      {/* Entity Counts (Section 54) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Requests</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">
            {diag?.counts?.maintenance_requests || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Plans</span>
          <div className="text-2xl font-black text-blue-600 mt-0.5">
            {diag?.counts?.maintenance_plans || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Assignments</span>
          <div className="text-2xl font-black text-indigo-600 mt-0.5">
            {diag?.counts?.plan_assignments || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Executions</span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">
            {diag?.counts?.execution_records || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Critical Events</span>
          <div className="text-2xl font-black text-rose-600 mt-0.5">
            {diag?.counts?.critical_events || 0}
          </div>
        </div>
      </div>

      {/* Request Inspection & Relationship Inspector (Section 54) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Selected Request Inspection
            </h3>
            <p className="text-xs text-slate-500">
              Examine relational integrity from Request → Plan → Execution
            </p>
          </div>

          {/* Request selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Select Request:</span>
            <select
              value={selectedRequestId || req?.task_id || ''}
              onChange={(e) => setSelectedRequestId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
            >
              {taskList?.items?.map((t: any) => (
                <option key={t.task_id} value={t.task_id}>
                  {t.reference_no} ({t.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {req ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Request ID</span>
              <div className="font-black text-slate-900 text-sm">{req.reference_no}</div>
              <span className="text-[10px] text-slate-500">PK #{req.task_id}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Current Status</span>
              <div className="font-black text-emerald-700 text-sm">{req.current_status}</div>
              <span className="text-[10px] text-slate-500">State machine aligned</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Current Plan & Version</span>
              <div className="font-black text-blue-900 text-sm">
                {req.current_plan_number || (req.current_plan_id ? `PLAN-#${req.current_plan_id}` : 'None')}
              </div>
              <span className="text-[10px] text-blue-700 font-bold">Active Version: v{req.active_version}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Task Progress</span>
              <div className="font-black text-slate-800 text-sm">
                {req.completed_tasks} / {req.tasks_count} Completed
              </div>
              <span className="text-[10px] text-amber-700 font-bold">{req.pending_tasks} Pending</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No request selected for inspection.</div>
        )}
      </div>

      {/* ONE REQUEST TRACE (Section 55) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              One Request Trace: {traceData?.request_number || `Request #${selectedRequestId || 1001}`}
            </h3>
            <p className="text-xs text-slate-500">
              Complete chronological audit trail with actual database recorded timestamps
            </p>
          </div>
          <History className="w-4 h-4 text-slate-400" />
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
          {traceData?.trace?.map((ev: any, idx: number) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-blue-600 transition-colors" />
              <div className="flex items-center space-x-2">
                <span className="font-mono text-slate-400 font-bold text-[11px]">{ev.time}</span>
                <span className="font-extrabold text-slate-900">{ev.action}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                  {ev.status}
                </span>
              </div>
              {ev.detail && (
                <p className="text-[11px] text-slate-500 mt-0.5 pl-11">{ev.detail}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default WorkflowDiagnostics
