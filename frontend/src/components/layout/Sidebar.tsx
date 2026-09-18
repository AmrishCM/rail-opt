import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  GitCommit,
  Wrench,
  Sliders,
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
    { to: '/planner', label: 'Optimization Engine', icon: Sliders },
    { to: '/simulation', label: 'Discrete Simulation', icon: PlayCircle },
    { to: '/scenarios', label: 'What-If Studio', icon: GitPullRequest },
    { to: '/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
    { to: '/assistant', label: 'Operations Co-Pilot', icon: Bot },
    { to: '/data', label: 'Data & Ingestion', icon: Database },
    { to: '/settings', label: 'Solver Configuration', icon: Settings }
  ]

  return (
    <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 min-h-[calc(100vh-56px)] text-zinc-300 select-none">
      <div className="p-3 space-y-5">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Core Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 rounded-l-none'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-zinc-800">
        <div className="rounded-md bg-zinc-900/60 p-3 border border-zinc-800/80 text-xs">
          <div className="flex items-center justify-between text-zinc-300 font-medium mb-1">
            <span className="text-[11px] text-zinc-400">Solver Engine</span>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">
              CP-SAT
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Multi-objective possession optimization active.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
