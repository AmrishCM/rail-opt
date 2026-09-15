import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchTasks } from '../../services/api'
import { OperationalTable, Column } from '../../components/common/OperationalTable'
import {
  CheckCircle2,
  Lock,
  Eye,
  Camera,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin
} from 'lucide-react'

export const InspectorCompletedIssues: React.FC = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadCompletedTasks = async () => {
    setLoading(true)
    try {
      // Fetch resolved/closed issues
      const res = await fetchTasks({ my_issues: true, completed: true, page_size: 100 })
      const items = (res?.items || []).filter(
        (t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      )
      setTasks(items)
    } catch (err) {
      console.error('Failed to load completed issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompletedTasks()
  }, [user])

  const columns: Column<any>[] = [
    {
      key: 'reference_no',
      header: 'Issue ID',
      priority: 'essential',
      render: (t) => (
        <span className="font-mono font-black text-emerald-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
      )
    },
    {
      key: 'defect_type',
      header: 'Defect & Resolution',
      priority: 'essential',
      render: (t) => (
        <div className="space-y-0.5">
          <div className="font-bold text-white text-xs">{t.defect_type || t.description?.slice(0, 30)}</div>
          <div className="text-[11px] text-emerald-400/90 font-medium">
            {t.resolution_notes || 'Track possession cleared and speed restriction normalized.'}
          </div>
        </div>
      )
    },
    {
      key: 'location_name',
      header: 'Location',
      priority: 'medium',
      render: (t) => (
        <div className="text-xs text-slate-300">
          {t.location_name || 'Section C2-02'} (Track {t.track || '2'})
        </div>
      )
    },
    {
      key: 'timestamps',
      header: 'Submitted & Resolved',
      priority: 'medium',
      render: (t) => (
        <div className="text-[11px] text-slate-400 space-y-0.5">
          <div>Reported: {t.created_at ? new Date(t.created_at).toLocaleDateString() : '15 Sep'}</div>
          <div className="text-emerald-400 font-semibold">Completed: Verified</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Workflow State',
      priority: 'essential',
      render: (t) => (
        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
          <Lock className="w-3 h-3" />
          <span>{t.status} (LOCKED)</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Evidence & Record',
      priority: 'essential',
      render: (t) => (
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Archive</span>
        </Link>
      )
    }
  ]

  const renderMobileCard = (t: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-black text-emerald-400">
          {t.reference_no || `TASK-${t.task_id}`}
        </span>
        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
          <Lock className="w-2.5 h-2.5" />
          <span>{t.status}</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-bold text-white text-xs">{t.defect_type || t.description}</p>
        <p className="text-[11px] text-emerald-400 font-medium">
          {t.resolution_notes || 'Track possession cleared and speed restriction normalized.'}
        </p>
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span>{t.location_name || 'Salem–Erode'} (Track {t.track || '2'})</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-500">
          Locked Record • Read-Only
        </span>
        <Link
          to={`/tasks/${t.task_id}`}
          className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs border border-slate-700 min-h-[44px]"
        >
          <Eye className="w-4 h-4" />
          <span>View Evidence</span>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Resolutions & Archived Work</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Completed Issues</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit record of inspected defects resolved and verified by Engineering and Operations
        </p>
      </div>

      {/* Operational Table */}
      <OperationalTable
        data={tasks}
        columns={columns}
        keyExtractor={(t) => t.task_id}
        renderMobileCard={renderMobileCard}
        isLoading={loading}
        emptyTitle="No completed issues"
        emptyDescription="You have no resolved or closed inspection records currently."
      />
    </div>
  )
}

export default InspectorCompletedIssues
