import React, { useState, useEffect } from 'react'
import {
  FileText,
  Clock,
  User,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import api from '../../services/api'

interface AuditLogEntry {
  log_id: number
  action: string
  entity_type: string
  entity_id: string
  user_id: string
  details: string
  created_at: string
}

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL')

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const res = await api.get('/system/audit', { params: { limit: 150 } })
      setLogs(res.data || [])
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity
    return matchesSearch && matchesEntity
  })

  const entityTypes = ['ALL', ...Array.from(new Set(logs.map((l) => l.entity_type).filter(Boolean)))]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              System Audit Trail & Compliance Log
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable operational record • Tracks all state changes, AI planning events, and safety sign-offs
            </p>
          </div>
        </div>

        <button
          onClick={loadAuditLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, reference ID, actor, or details..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {entityTypes.map((et) => (
            <button
              key={et}
              onClick={() => setSelectedEntity(et)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedEntity === et
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {et}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Retrieving immutable audit records...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No records found</p>
          <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => {
                  const isApproval = log.action?.includes('APPROVE')
                  const isReject = log.action?.includes('REJECT')
                  const isReplan = log.action?.includes('REPLAN')
                  const isCreate = log.action?.includes('REPORT') || log.action?.includes('CREATE')

                  return (
                    <tr key={log.log_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 shrink-0 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            isApproval
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isReject
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isReplan
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isCreate
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-300 font-bold">{log.entity_id}</span>
                        {log.entity_type && (
                          <span className="text-[9px] text-slate-500 ml-1.5 uppercase font-sans">
                            ({log.entity_type})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-blue-400 font-medium whitespace-nowrap">
                        {log.user_id}
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-sans text-xs max-w-md break-words">
                        {log.details}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditTrailPage
