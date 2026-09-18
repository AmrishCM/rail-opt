import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import {
  LayoutDashboard,
  Wrench,
  PlusCircle,
  Calendar,
  Train,
  Bell,
  User,
  Compass
} from 'lucide-react'

export const EngineerLayout: React.FC = () => {
  const { user } = useAuth()

  const navItems = [
    { to: '/engineer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/engineer/work-queue', label: 'Assigned Work', icon: Wrench },
    { to: '/engineer/report-issue', label: 'Report Defect', icon: PlusCircle },
    { to: '/engineer/timetable', label: 'Operational Timetable', icon: Calendar },
    { to: '/engineer/track-view', label: 'Track View', icon: Train },
    { to: '/engineer/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header onOpenEmergencyModal={() => {}} />

      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Sidebar */}
        <aside className="hidden md:flex flex-col justify-between w-60 bg-zinc-950 border-r border-zinc-800 shrink-0 min-h-[calc(100vh-56px)] text-zinc-300 select-none">
          <div className="p-3 space-y-4">
            {/* Engineer Identity Scope */}
            <div className="p-3 bg-zinc-900/60 rounded-md border border-zinc-800/80">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs">
                <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Field Engineering</span>
              </div>
              <div className="text-xs text-zinc-200 font-medium mt-1 truncate">
                {user?.full_name || 'Maintenance Engineer'}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Department: <span className="text-zinc-300 font-medium">{user?.department || 'Civil Track'}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider px-3 mb-1.5">
                Execution & Works
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
            </nav>
          </div>

          {/* Footer operational scope */}
          <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500">
            <div className="font-medium text-zinc-400">RailOpt Maintenance</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Role: Maintenance Engineer</div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-x-auto min-h-[calc(100vh-56px)] pb-20 md:pb-8 bg-zinc-950">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}

export default EngineerLayout
