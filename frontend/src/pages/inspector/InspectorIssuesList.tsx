import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchTasks } from '../../services/api'
import { DataTable, ColumnDef } from '../../components/common/DataTable'
import { StatCard, StatsGrid } from '../../components/common/StatCard'
import { StatusBadge, PriorityBadge } from '../../components/common/RailwayBadges'
import {
  Plus,
  Search,
  Eye,
  AlertTriangle,
  MapPin,
  Filter,
  Layers
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

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'UNDER_REVIEW' && !['NEW', 'SUBMITTED', 'UNDER_REVIEW'].includes(t.status))
        return false
      if (statusFilter === 'APPROVED' && !['APPROVED', 'SCHEDULED', 'PLAN_READY'].includes(t.status))
        return false
      if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false
      if (statusFilter === 'RESOLVED' && !['RESOLVED', 'CLOSED', 'VERIFIED'].includes(t.status))
        return false
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

  // Stat derivations
  const totalCount = tasks.length
  const activeCount = tasks.filter((t) => t.status !== 'CLOSED' && t.status !== 'REJECTED' && t.status !== 'VERIFIED').length
  const underReviewCount = tasks.filter((t) => ['NEW', 'SUBMITTED', 'UNDER_REVIEW'].includes(t.status)).length
  const approvedCount = tasks.filter((t) => ['APPROVED', 'SCHEDULED', 'PLAN_READY'].includes(t.status)).length

  const columns: ColumnDef<any>[] = [
    {
      key: 'reference_no',
      header: 'Issue ID',
      priority: 'essential',
      render: (t) => (
        <span className="font-mono font-bold text-zinc-200">
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
          <div className="font-medium text-zinc-200 text-xs">{t.defect_type || t.description?.slice(0, 32)}</div>
          <div className="text-[11px] text-zinc-400 line-clamp-1">{t.description}</div>
        </div>
      )
    },
    {
      key: 'location_name',
      header: 'Location / Track',
      priority: 'medium',
      render: (t) => (
        <div className="text-xs space-y-0.5">
          <div className="text-zinc-300 font-medium">{t.location_name || 'Section C2-02'}</div>
          <div className="text-[11px] text-zinc-500 font-mono">Track: {t.track || '2'}</div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      priority: 'medium',
      render: (t) => <PriorityBadge level={t.severity || '3'} />
    },
    {
      key: 'status',
      header: 'Workflow State',
      priority: 'essential',
      render: (t) => <StatusBadge status={t.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      priority: 'essential',
      render: (t) => (
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors active:translate-y-[1px]"
        >
          <Eye className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
          <span>Details</span>
        </Link>
      )
    }
  ]

  const renderMobileCard = (t: any) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-xs text-zinc-200">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
        <StatusBadge status={t.status} />
      </div>

      <div className="space-y-1">
        <div className="font-medium text-zinc-100 text-xs">{t.defect_type || t.description}</div>
        <p className="text-[11px] text-zinc-400 line-clamp-2">{t.description}</p>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-500 pt-1">
          <span className="flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
            <span>{t.location_name || 'Salem–Erode'} (Track {t.track || '2'})</span>
          </span>
          <span>•</span>
          <PriorityBadge level={t.severity || '3'} showIcon={false} />
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
        <span className="text-[11px] text-zinc-500 font-mono">
          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today'}
        </span>
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>View Details</span>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header with Title and Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">My Reported Issues</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {user?.section_code || 'Salem–Erode (C2-02)'} • Active defect queue & maintenance scheduling records
          </p>
        </div>

        <Link
          to="/inspector/report-issue"
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-none active:translate-y-[1px] shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>Report Issue</span>
        </Link>
      </div>

      {/* Standardized Stat Cards Grid */}
      <StatsGrid>
        <StatCard
          label="TOTAL DEFECTS"
          value={totalCount}
          delta="Reported across section"
          isLoading={loading}
        />
        <StatCard
          label="ACTIVE DEFECTS"
          value={activeCount}
          delta={activeCount > 0 ? `${activeCount} pending resolution` : 'All defects cleared'}
          urgency={activeCount > 0 ? 'urgent' : 'normal'}
          isLoading={loading}
        />
        <StatCard
          label="UNDER REVIEW"
          value={underReviewCount}
          delta="Awaiting manager validation"
          isLoading={loading}
        />
        <StatCard
          label="APPROVED FOR BLOCK"
          value={approvedCount}
          delta="Scheduled for possession"
          isLoading={loading}
        />
      </StatsGrid>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search defect ID, description, location..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto bg-zinc-950 border border-zinc-800 rounded-md p-1 text-[11px]">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'RESOLVED', label: 'Resolved' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
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
        emptyTitle="No issues matching criteria"
        emptyDescription="There are no reported issues matching your current search or filter selection."
        emptyActionText="Report New Issue"
        onEmptyAction={() => navigate('/inspector/report-issue')}
      />
    </div>
  )
}

export default InspectorIssuesList
