import React from 'react'
import { Cpu, CheckCircle2, Clock, GitFork, ShieldCheck, Activity } from 'lucide-react'

interface SolverStatsProps {
  stats?: {
    tasks_considered?: number
    block_windows?: number
    hard_constraints?: number
    candidate_assignments?: number
    final_assignments?: number
    solver_status?: string
    solve_time_seconds?: number
    branches?: number
    wall_time?: number
  }
}

export const SolverStatsCard: React.FC<SolverStatsProps> = ({ stats }) => {
  const s = stats || {
    tasks_considered: 50,
    block_windows: 120,
    hard_constraints: 417,
    candidate_assignments: 284,
    final_assignments: 50,
    solver_status: 'FEASIBLE',
    solve_time_seconds: 1.34,
    branches: 148
  }

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md p-5 space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">Google OR-Tools CP-SAT Solver Trace</h4>
            <span className="text-[10px] text-slate-400">Mathematical Constraint Programming Diagnostics</span>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {s.solver_status || 'OPTIMAL'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">Tasks Considered</span>
          <span className="text-lg font-extrabold text-slate-100">{s.tasks_considered}</span>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">Block Windows</span>
          <span className="text-lg font-extrabold text-slate-100">{s.block_windows}</span>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">Hard Constraints</span>
          <span className="text-lg font-extrabold text-amber-400">{s.hard_constraints}</span>
        </div>

        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
          <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">Solve Runtime</span>
          <span className="text-lg font-extrabold text-blue-400">{s.solve_time_seconds}s</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-slate-400">Candidate Search Pairs:</span>
          <span className="font-bold text-slate-200">{s.candidate_assignments}</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-slate-400">Final Assigned Tasks:</span>
          <span className="font-bold text-emerald-400">{s.final_assignments}</span>
        </div>
      </div>
    </div>
  )
}
