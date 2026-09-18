import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchTasks } from '../../services/api'
import {
  Workflow,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react'

const PIPELINE_STAGES = [
  { id: 'NEW', label: 'REPORTED', color: 'bg-slate-700 text-slate-200' },
  { id: 'UNDER_REVIEW', label: 'UNDER REVIEW', color: 'bg-blue-600/30 text-blue-300 border border-blue-500/40' },
  { id: 'APPROVED', label: 'APPROVED', color: 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' },
  { id: 'SCHEDULED', label: 'ASSIGNED', color: 'bg-purple-600/30 text-purple-300 border border-purple-500/40' },
  { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: 'bg-amber-600/30 text-amber-300 border border-amber-500/40' },
  { id: 'RESOLVED', label: 'RESOLVED', color: 'bg-teal-600/30 text-teal-300 border border-teal-500/40' },
  { id: 'VERIFIED', label: 'VERIFIED', color: 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' },
  { id: 'CLOSED', label: 'CLOSED', color: 'bg-emerald-500 text-slate-950 font-black' }
]

export const ManagerIssueStatus: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetchTasks({ page_size: 150 })
      setTasks(res?.items || [])
    } catch (err) {
      console.error('Failed to load status tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false
    if (selectedSeverity !== 'ALL' && String(t.severity) !== selectedSeverity) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const ref = (t.reference_no || '').toLowerCase()
      const desc = (t.description || '').toLowerCase()
      const type = (t.defect_type || '').toLowerCase()
      const loc = (t.location_name || '').toLowerCase()
      return ref.includes(q) || desc.includes(q) || type.includes(q) || loc.includes(q)
    }
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Workflow className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>End-to-End Operational Lifecycle</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">Issue Workflow Status</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor state progression from field report through manager review, engineer execution, and final possession clearance
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-3 py-1.5 rounded-md border border-zinc-700/80">
          Total Track Issues: <strong className="text-zinc-100 font-semibold">{tasks.length}</strong>
        </div>
      </div>


      {/* Canonical Workflow Visual Stepper (Section 9) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
          Lifecycle Pipeline Progression
        </div>
        <div className="flex items-center min-w-[760px] space-x-1.5">
          {PIPELINE_STAGES.map((st, idx) => {
            const count = tasks.filter(t => t.status === st.id).length
            return (
              <React.Fragment key={st.id}>
                <div
                  onClick={() => setSelectedStatus(selectedStatus === st.id ? 'ALL' : st.id)}
                  className={`flex-1 p-2.5 rounded-xl cursor-pointer transition-all text-center ${
                    selectedStatus === st.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-black uppercase truncate">{st.label}</div>
                  <div className="text-base font-black font-mono mt-0.5">{count}</div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, defect type, section, or description..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white"
          >
            <option value="ALL">All Severities</option>
            <option value="5">Severity 5 (Critical)</option>
            <option value="4">Severity 4 (High)</option>
            <option value="3">Severity 3 (Medium)</option>
            <option value="2">Severity 2 (Low)</option>
            <option value="1">Severity 1 (Routine)</option>
          </select>
        </div>
      </div>

      {/* Issues Grid / List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading issues...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
          No issues found matching the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((t) => (
            <div
              key={t.task_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-blue-400">
                    {t.reference_no || `TASK-${t.task_id}`}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    t.severity >= 4 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    Sev {t.severity || 3}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white leading-snug">
                  {t.defect_type || t.description}
                </h3>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{t.location_name || 'Salem–Erode'} (Track {t.track || '2'})</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Reporter: {t.created_user_name || 'Inspector'} {t.assigned_user_name ? `• Assigned: ${t.assigned_user_name}` : ''}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {t.status?.replace('_', ' ')}
                </span>
                <Link
                  to={`/tasks/${t.task_id}`}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagerIssueStatus
