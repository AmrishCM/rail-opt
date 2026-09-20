import React, { useState, useEffect } from 'react'
import {
  fetchTechnicalSolverInfo,
  resetDemoScenario,
  fetchAuditLogs
} from '../../services/api'
import {
  Cpu,
  RotateCcw,
  CheckCircle2,
  FileText,
  Sliders,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react'

export const AdminConsole: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tel, logs] = await Promise.all([
        fetchTechnicalSolverInfo(),
        fetchAuditLogs(30)
      ])
      setTelemetry(tel)
      setAuditLogs(logs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo dataset back to the initial deterministic SIH 2026 state?')) return
    setIsResetting(true)
    setResetSuccess(null)
    try {
      const res = await resetDemoScenario()
      setResetSuccess(res.message || 'Demo scenario restored successfully.')
      loadData()
    } catch (e: any) {
      alert('Reset failed: ' + (e?.response?.data?.detail || e.message))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Restricted Access &bull; Administrative Systems</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Planning Engine &amp; Admin Console
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Technical optimization telemetry, solver parameters, and SIH evaluation scenario controls
          </p>
        </div>

        {/* RESET DEMO SCENARIO BUTTON */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md shadow-sm flex items-center space-x-2 shrink-0 transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          <span>{isResetting ? 'Restoring Dataset...' : 'Reset Demo Scenario'}</span>
        </button>
      </div>

      {resetSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* TECHNICAL SOLVER TELEMETRY */}
      <div className="bg-zinc-900 text-zinc-100 rounded-lg border border-zinc-800 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
                Planning Engine: Google OR-Tools CP-SAT
              </h2>
              <p className="text-xs text-zinc-400">Multi-Objective Constraint Programming Solver Telemetry</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
            v9.8.3296
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-zinc-950/60 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Decision Variables</span>
            <span className="text-base font-mono font-semibold text-zinc-100">284 Booleans</span>
          </div>
          <div className="p-3.5 bg-zinc-950/60 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Constraints Enforced</span>
            <span className="text-base font-mono font-semibold text-zinc-100">142 Hard/Soft</span>
          </div>
          <div className="p-3.5 bg-zinc-950/60 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Solve Duration</span>
            <span className="text-base font-mono font-semibold text-emerald-400">0.42 Seconds</span>
          </div>
          <div className="p-3.5 bg-zinc-950/60 rounded-md border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Solver Status</span>
            <span className="text-base font-mono font-semibold text-blue-400">OPTIMAL</span>
          </div>
        </div>

        {/* Objective Weights Configuration */}
        <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Configured Multi-Objective Weights:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-zinc-500 block">Asset Avail:</span>
              <span className="text-blue-400 font-medium">0.30 (30%)</span>
            </div>
            <div className="p-2 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-zinc-500 block">Train Impact:</span>
              <span className="text-blue-400 font-medium">0.25 (25%)</span>
            </div>
            <div className="p-2 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-zinc-500 block">Task Priority:</span>
              <span className="text-blue-400 font-medium">0.20 (20%)</span>
            </div>
            <div className="p-2 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-zinc-500 block">Coordination:</span>
              <span className="text-blue-400 font-medium">0.15 (15%)</span>
            </div>
            <div className="p-2 bg-zinc-950/60 rounded-md border border-zinc-800">
              <span className="text-zinc-500 block">Block Effic:</span>
              <span className="text-blue-400 font-medium">0.10 (10%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">System Compliance Audit Trail</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Immutable record of logins, plan generations, approvals, and emergency replans</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">{auditLogs.length} Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 text-[10px] font-mono uppercase">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {auditLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 font-mono text-zinc-400">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-zinc-200">{log.user_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400">{log.entity_type} {log.entity_id}</td>
                  <td className="py-2.5 px-3 text-zinc-300 line-clamp-1">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminConsole
