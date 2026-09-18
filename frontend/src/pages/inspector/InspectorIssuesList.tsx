import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchTasks } from '../../services/api'
import { DataTable, ColumnDef } from '../../components/common/DataTable'
import {
  PlusCircle,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  MapPin
} from 'lucide-react'

export const InspectorIssuesList: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetchTasks({ my_issues: true, page_size: 100 })
      setTasks(res?.items || [])
    } catch (err) {
      console.error('Failed to load inspector issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [user])

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'UNDER_REVIEW' && !['NEW', 'SUBMITTED', 'UNDER_REVIEW'].includes(t.status)) return false
      if (statusFilter === 'APPROVED' && !['APPROVED', 'SCHEDULED'].includes(t.status)) return false
      if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false
      if (statusFilter === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(t.status)) return false
    }
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

  const columns: ColumnDef<any>[] = [
    {
      key: 'reference_no',
      header: 'Issue ID',
      priority: 'essential',
      render: (t) => (
        <span className="font-mono font-black text-blue-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
      )
    },
    {
      key: 'defect_type',
      header: 'Defect & Description',
      priority: 'essential',
      render: (t) => (
        <div className="space-y-0.5">
          <div className="font-bold text-white text-xs">{t.defect_type || t.description?.slice(0, 30)}</div>
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
          <div className="text-[10px] text-slate-400">Track: {t.track || '2'}</div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      priority: 'medium',
      render: (t) => (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
          t.severity >= 4 ? 'bg-red-500/20 text-red-400' : t.severity === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
        }`}>
          Sev {t.severity || '3'}/5
        </span>
      )
    },
    {
      key: 'status',
      header: 'Workflow Status',
      priority: 'essential',
      render: (t) => (
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
          t.status === 'RESOLVED' || t.status === 'CLOSED'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : t.status === 'APPROVED' || t.status === 'SCHEDULED'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            : t.status === 'IN_PROGRESS'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            : 'bg-slate-700 text-slate-300'
        }`}>
          {t.status?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      priority: 'essential',
      render: (t) => (
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </Link>
      )
    }
  ]

  const renderMobileCard = (t: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-black text-blue-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
          t.status === 'RESOLVED' || t.status === 'CLOSED'
            ? 'bg-emerald-500/20 text-emerald-300'
            : t.status === 'APPROVED' || t.status === 'SCHEDULED'
            ? 'bg-blue-500/20 text-blue-300'
            : t.status === 'IN_PROGRESS'
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-slate-800 text-slate-400'
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

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-500">
          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'}
        </span>
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs border border-slate-700 min-h-[44px]"
        >
          <Eye className="w-4 h-4" />
          <span>View Issue</span>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">My Reported Issues</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track defects logged by {user?.full_name || 'you'} across section {user?.section_code || 'C2-02'}
          </p>
        </div>
        <Link
          to="/inspector/report-issue"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 shrink-0 min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>+ Report New Issue</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, defect, location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Table */}
      <DataTable
        data={filteredTasks}
        columns={columns}
        keyExtractor={(t) => t.task_id}
        renderMobileCard={renderMobileCard}
        isLoading={loading}
        emptyTitle="No reported issues found"
        emptyDescription="No issues match your active search or status filter."
        emptyActionText="+ Report Issue"
        onEmptyAction={() => navigate('/inspector/report-issue')}
      />
    </div>
  )
}

export default InspectorIssuesList
