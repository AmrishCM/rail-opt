import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchWorkflowDiagnostics,
  fetchTasks,
  fetchRequestTrace,
  resetDemoScenario
} from '../../services/api'
import {
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  History,
  GitBranch,
  RefreshCw,
  Search,
  Activity,
  ShieldAlert
} from 'lucide-react'

export const WorkflowDiagnostics: React.FC = () => {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  // 1. Fetch system diagnostic payload
  const { data: diag, isLoading, refetch } = useQuery({
    queryKey: ['workflow-diagnostics', selectedRequestId],
    queryFn: () => fetchDiagnostics(selectedRequestId || undefined)
  })

  // 2. Fetch list of tasks for the selector
  const { data: taskList } = useQuery({
    queryKey: ['diagnostic-task-list'],
    queryFn: () => fetchTasks({ page_size: 50 })
  })

  // 3. Fetch specific audit trace for selected request
  const { data: traceData } = useQuery({
    queryKey: ['request-trace', selectedRequestId || diag?.selected_request?.task_id],
    queryFn: () => fetchRequestTrace(selectedRequestId || diag?.selected_request?.task_id || 1),
    enabled: !!(selectedRequestId || diag?.selected_request?.task_id)
  })

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database back to initial SIH 2026 deterministic seed data?')) return
    setIsResetting(true)
    setResetMessage(null)
    try {
      const res = await resetDemoScenario()
      setResetMessage(res.message || 'Demo scenario reset successfully.')
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Admin &amp; Developer Tool</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Workflow Diagnostics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time authoritative database state verification, entity relationship auditor &amp; trace inspector
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Refresh database diagnostics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>{isResetting ? 'Resetting Database...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 flex items-center justify-between">
          <span>{resetMessage}</span>
          <button onClick={() => setResetMessage(null)} className="text-emerald-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Database State Card */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs font-mono uppercase text-zinc-300 flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
            <span>Authoritative Database State</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Last updated: {diag?.last_updated ? new Date(diag.last_updated).toLocaleString() : 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Connection Status</span>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${diag?.database?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-semibold text-sm text-zinc-100">
                {diag?.database?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Latency: {diag?.database?.latency_ms || 0} ms
            </span>
          </div>

          <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Database Engine</span>
            <div className="font-semibold text-sm text-zinc-100">
              {diag?.database?.type?.toUpperCase() || 'SQLITE'}
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-block ${
              diag?.database?.type === 'postgresql' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {diag?.database?.mode || 'SQLite Development Mode'}
            </span>
          </div>

          <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Latest Incident</span>
            <div className="font-medium text-xs text-zinc-200 truncate">
              {diag?.latest_event?.event_number || 'None'}
            </div>
            <p className="text-[10px] text-zinc-400 truncate">
              {diag?.latest_event?.description || 'Clean operations'}
            </p>
          </div>
        </div>
      </div>

      {/* Entity Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Requests</span>
          <div className="text-xl font-semibold font-mono text-zinc-100 mt-0.5">
            {diag?.counts?.maintenance_requests || 0}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Plans</span>
          <div className="text-xl font-semibold font-mono text-blue-400 mt-0.5">
            {diag?.counts?.maintenance_plans || 0}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Assignments</span>
          <div className="text-xl font-semibold font-mono text-zinc-200 mt-0.5">
            {diag?.counts?.plan_assignments || 0}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Executions</span>
          <div className="text-xl font-semibold font-mono text-emerald-400 mt-0.5">
            {diag?.counts?.execution_records || 0}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Critical Events</span>
          <div className="text-xl font-semibold font-mono text-red-400 mt-0.5">
            {diag?.counts?.critical_events || 0}
          </div>
        </div>
      </div>

      {/* Request Inspection & Relationship Inspector */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">
              Selected Request Inspection
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Examine relational integrity from Request &rarr; Plan &rarr; Execution
            </p>
          </div>

          {/* Request selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-400 font-mono">Select Request:</span>
            <select
              value={selectedRequestId || req?.task_id || ''}
              onChange={(e) => setSelectedRequestId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-md border border-zinc-800 text-xs text-zinc-200 bg-zinc-950 focus:border-blue-500 focus:outline-hidden"
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
            <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Request ID</span>
              <div className="font-semibold text-blue-400 font-mono text-sm">{req.reference_no}</div>
              <span className="text-[10px] text-zinc-500 font-mono">PK #{req.task_id}</span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Current Status</span>
              <div className="font-semibold text-emerald-400 font-mono text-sm">{req.current_status}</div>
              <span className="text-[10px] text-zinc-500 font-mono">State machine aligned</span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Current Plan &amp; Version</span>
              <div className="font-semibold text-zinc-200 font-mono text-sm">
                {req.current_plan_number || (req.current_plan_id ? `PLAN-#${req.current_plan_id}` : 'None')}
              </div>
              <span className="text-[10px] text-blue-400 font-mono">Active Version: v{req.active_version}</span>
            </div>

            <div className="p-3 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Task Progress</span>
              <div className="font-semibold text-zinc-200 font-mono text-sm">
                {req.completed_tasks} / {req.tasks_count} Completed
              </div>
              <span className="text-[10px] text-amber-400 font-mono">{req.pending_tasks} Pending</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic">No request selected for inspection.</div>
        )}
      </div>

      {/* ONE REQUEST TRACE */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">
              One Request Trace: {traceData?.request_number || `Request #${selectedRequestId || 1001}`}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Complete chronological audit trail with actual database recorded timestamps
            </p>
          </div>
          <History className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
        </div>

        <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-zinc-800 text-xs">
          {traceData?.trace?.map((ev: any, idx: number) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[23px] top-1 w-2 h-2 rounded-full bg-zinc-600 group-hover:bg-blue-500 transition-colors" />
              <div className="flex items-center space-x-2">
                <span className="font-mono text-zinc-500 text-[11px]">{ev.time}</span>
                <span className="font-medium text-zinc-200">{ev.action}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                  {ev.status}
                </span>
              </div>
              {ev.detail && (
                <p className="text-[11px] text-zinc-400 mt-0.5 pl-11">{ev.detail}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WorkflowDiagnostics
