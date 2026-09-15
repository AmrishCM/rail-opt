import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  ClipboardList,
  CheckCircle2,
  Bell,
  User,
  Shield,
  Train,
  Compass
} from 'lucide-react'

export const InspectorLayout: React.FC = () => {
  const { user } = useAuth()

  const navItems = [
    { to: '/inspector/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inspector/timetable', label: 'Timetable', icon: Calendar },
    { to: '/inspector/report-issue', label: 'New Issue', icon: PlusCircle, highlight: true },
    { to: '/inspector/issues', label: 'My Issues', icon: ClipboardList },
    { to: '/inspector/completed', label: 'Completed Issues', icon: CheckCircle2 },
    { to: '/inspector/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header onOpenEmergencyModal={() => {}} />

      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Sidebar (Hidden on Mobile < 768px) */}
        <aside className="hidden md:flex flex-col justify-between w-56 lg:w-64 bg-slate-900 border-r border-slate-800 shrink-0 min-h-[calc(100vh-64px)]">
          <div className="p-4 space-y-5">
            {/* Inspector Identity Card */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
              <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs">
                <Compass className="w-4 h-4 shrink-0" />
                <span className="truncate">Field Inspector Workspace</span>
              </div>
              <div className="text-[11px] text-slate-300 font-semibold mt-1">
                {user?.full_name || 'Inspector'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Section: <span className="text-blue-400 font-bold">{user?.section_code || 'Salem–Erode (C2-02)'}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Field Operations
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        item.highlight
                          ? isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Footer operational scope */}
          <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="font-bold text-slate-300">RailOpt Field Operations</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Role: Field Inspector (Dedicated)</div>
          </div>
        </aside>

        {/* Main Workspace (Takes full width, with bottom padding on mobile for bottom nav) */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] pb-20 md:pb-8 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile < 768px, 44px min touch target) */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  )
}

export default InspectorLayout
