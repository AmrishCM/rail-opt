import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GitCommit,
  Wrench,
  Sliders,
  FileCheck,
  PlayCircle,
  GitPullRequest,
  BarChart3,
  Bot,
  Database,
  Settings
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { to: '/corridors', label: 'Corridors & Timetable', icon: GitCommit },
    { to: '/maintenance', label: 'Defect Backlog', icon: Wrench },
    { to: '/planner', label: 'Optimization Engine', icon: Sliders, highlight: true },
    { to: '/simulation', label: 'Discrete Simulation', icon: PlayCircle },
    { to: '/scenarios', label: 'What-If Studio', icon: GitPullRequest },
    { to: '/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
    { to: '/assistant', label: 'AI Operations Co-Pilot', icon: Bot },
    { to: '/data', label: 'Data & Ingestion', icon: Database },
    { to: '/settings', label: 'Solver Configuration', icon: Settings }
  ]

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                } ${item.highlight && !isActive ? 'border border-blue-200 bg-blue-50/50 text-blue-900' : ''}`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
            <span>Operational Mode</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">ONLINE</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            CP-SAT Multi-Objective Possession Solver Active
          </p>
        </div>
      </div>
    </aside>
  )
}
