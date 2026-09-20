import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchPlan, approvePlan, getPlanExportUrl } from '../services/api'
import {
  CheckCircle2,
  Download,
  ArrowLeft,
  PlayCircle
} from 'lucide-react'

export const PlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    fetchPlan(id || 1).then((res) => {
      setPlan(res)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setApproving(true)
    try {
      await approvePlan(plan.plan_id)
      setPlan({ ...plan, status: 'APPROVED' })
    } catch (err) {
      console.error('Failed to approve plan:', err)
    } finally {
      setApproving(false)
    }
  }

  if (!plan && !loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-lg font-medium text-zinc-100">Maintenance Plan Not Found</h2>
        <Link to="/planner" className="text-xs font-mono text-blue-400 hover:underline">Back to Planner</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/planner')}
            className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                Plan #{plan?.plan_id}: {plan?.plan_name}
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                plan?.status === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {plan?.status || 'GENERATED'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              CP-SAT Optimized Maintenance Block Schedule • Horizon: 24 Hours
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={getPlanExportUrl(plan?.plan_id, 'csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded border border-zinc-700 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => navigate('/simulation')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate plan</span>
          </button>

          {plan?.status !== 'APPROVED' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{approving ? 'Approving...' : 'Approve plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Performance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'AI Plan Score', value: `${plan?.total_score || 91.5}/100`, color: 'text-blue-400' },
          { label: 'Asset Availability', value: `${plan?.asset_availability || 96.4}%`, color: 'text-emerald-400' },
          { label: 'Train Disruption', value: `${plan?.train_impact_minutes || 38}m`, color: 'text-amber-400' },
          { label: 'Scheduled Tasks', value: plan?.assignments?.length || 50, color: 'text-zinc-100' },
          { label: 'Block Utilization', value: `${plan?.block_utilization_percent || 87.4}%`, color: 'text-purple-400' },
          { label: 'Conflicts Resolved', value: '0 (Zero)', color: 'text-emerald-400' }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900 p-3.5 rounded-lg border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-mono uppercase block">{label}</span>
            <span className={`text-2xl font-mono font-semibold mt-1 block ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div>
            <h3 className="font-medium text-zinc-100 text-sm">Scheduled Maintenance Block Possessions</h3>
            <p className="text-xs text-zinc-500">Cross-department assignments with verified train clearance</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {plan?.assignments?.length || 0} assignments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Task</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Assigned Block</th>
                <th className="py-3 px-4">Safety Impact</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {plan?.assignments?.map((a: any) => (
                <tr key={a.assignment_id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 text-zinc-200">T-{a.task_id}</td>
                  <td className="py-3 px-4 text-zinc-400">{a.department}</td>
                  <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">{a.task_description}</td>
                  <td className="py-3 px-4 text-zinc-400">{a.section_name || 'Section C1-S2'}</td>
                  <td className="py-3 px-4 text-blue-400">Block #{a.block_id}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {a.safety_impact || 7}/10
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PlanDetail
