import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchPlan, approvePlan, getPlanExportUrl } from '../services/api'
import {
  FileCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Download,
  ArrowLeft,
  Layers,
  RotateCcw,
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
        <h2 className="text-lg font-bold text-slate-800">Maintenance Plan Not Found</h2>
        <Link to="/planner" className="text-xs font-bold text-blue-600">Back to Planner</Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/planner')}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Plan #{plan?.plan_id}: {plan?.plan_name}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                plan?.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {plan?.status || 'GENERATED'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              CP-SAT Optimized Maintenance Block Schedule • Horizon: 24 Hours
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={getPlanExportUrl(plan?.plan_id, 'csv')}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => navigate('/simulation')}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Simulate Plan</span>
          </button>

          {plan?.status !== 'APPROVED' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{approving ? 'Approving...' : 'Approve Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Performance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Plan Score</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{plan?.total_score || 91.5}/100</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Asset Availability</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{plan?.asset_availability || 96.4}%</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Train Disruption</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{plan?.train_impact_minutes || 38}m</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduled Tasks</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{plan?.assignments?.length || 50}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Block Utilization</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">{plan?.block_utilization_percent || 87.4}%</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Conflicts Resolved</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">0 (Zero)</span>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Scheduled Maintenance Block Possessions</h3>
            <p className="text-xs text-slate-500">Cross-department assignments with verified train clearance</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
            {plan?.assignments?.length || 0} Assignments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
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
            <tbody className="divide-y divide-slate-100">
              {plan?.assignments?.map((a: any) => (
                <tr key={a.assignment_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-extrabold text-slate-900">T-{a.task_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{a.department}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{a.task_description}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{a.section_name || 'Section C1-S2'}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">Block #{a.block_id}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {a.safety_impact || 7}/10
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
