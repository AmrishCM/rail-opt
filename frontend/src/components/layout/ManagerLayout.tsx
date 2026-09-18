import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import { EmergencyReplanModal } from '../../pages/emergency/EmergencyReplanModal'
import {
  LayoutDashboard,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Wrench,
  PhoneCall,
  Bell,
  ShieldAlert,
  Sliders,
  Train,
  FileText
} from 'lucide-react'

export const ManagerLayout: React.FC = () => {
  const { user } = useAuth()
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)

  const navItems = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/status', label: 'Issue Statuses', icon: AlertTriangle },
    { to: '/manager/approval-planning', label: 'Approval & Planning', icon: ShieldAlert },
    { to: '/manager/timetable', label: 'Timetable', icon: Calendar },
    { to: '/manager/replan', label: 'Replanning', icon: RotateCcw },
    { to: '/manager/track-view', label: 'Track View', icon: Train },
    { to: '/manager/resources', label: 'Assets & Machinery', icon: Wrench },
    { to: '/manager/authorities', label: 'Authority Coordination', icon: PhoneCall },
    { to: '/manager/audit', label: 'Audit Trail', icon: FileText },
    { to: '/manager/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header onOpenEmergencyModal={() => setEmergencyModalOpen(true)} />

      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Sidebar */}
        <aside className="hidden md:flex flex-col justify-between w-60 bg-zinc-950 border-r border-zinc-800 shrink-0 min-h-[calc(100vh-56px)] text-zinc-300 select-none">
          <div className="p-3 space-y-4">
            {/* Manager Identity Card */}
            <div className="p-3 bg-zinc-900/60 rounded-md border border-zinc-800/80">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs">
                <Sliders className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Operations Control Hub</span>
              </div>
              <div className="text-xs text-zinc-200 font-medium mt-1 truncate">
                {user?.full_name || 'Operations Manager'}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Division: <span className="text-zinc-300 font-medium">{user?.division_name || 'Northern Zone'}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider px-3 mb-1.5">
                Operations & Planning
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
            <div className="font-medium text-zinc-400">RailOpt Control Operations</div>
            <div className="text-[10px] text-zinc-600 mt-0.5">Authority: Operations Manager</div>
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

      {/* Emergency Replan Modal */}
      {emergencyModalOpen && (
        <EmergencyReplanModal onClose={() => setEmergencyModalOpen(false)} />
      )}
    </div>
  )
}

export default ManagerLayout
