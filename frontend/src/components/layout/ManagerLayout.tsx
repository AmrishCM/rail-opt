import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import { EmergencyReplanModal } from '../../pages/emergency/EmergencyReplanModal'
import {
  LayoutDashboard,
  Brain,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Wrench,
  Users,
  PhoneCall,
  BarChart3,
  Bell,
  User,
  ShieldAlert,
  Sliders
} from 'lucide-react'

export const ManagerLayout: React.FC = () => {
  const { user } = useAuth()
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)

  // Part 7 & Master Redesign: Manager Primary Navigation
  const navItems = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/status', label: 'Issues', icon: AlertTriangle },
    { to: '/manager/approval-planning', label: 'Approval & Planning', icon: ShieldAlert, highlight: true },
    { to: '/manager/timetable', label: 'Timetable', icon: Calendar },
    { to: '/manager/replan', label: 'Replanning', icon: RotateCcw },
    { to: '/manager/status', label: 'Work Orders', icon: Wrench },
    { to: '/manager/engineers', label: 'Engineers', icon: Users },
    { to: '/manager/authorities', label: 'Authority Coordination', icon: PhoneCall },
    { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
    { to: '/manager/notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#172027] flex flex-col font-sans antialiased">
      {/* Top Header with Emergency Action for Manager */}
      <Header onOpenEmergencyModal={() => setEmergencyModalOpen(true)} />

      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Sidebar (Hidden on Mobile < 768px) */}
        <aside className="hidden md:flex flex-col justify-between w-56 lg:w-64 bg-[#0f172a] border-r border-slate-800 shrink-0 min-h-[calc(100vh-64px)] text-slate-100">
          <div className="p-4 space-y-5">
            {/* Manager Identity Card */}
            <div className="p-3 bg-slate-900 rounded-xl border border-rose-900/40">
              <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-xs">
                <Sliders className="w-4 h-4 shrink-0" />
                <span className="truncate">Operations Control Hub</span>
              </div>
              <div className="text-[11px] text-slate-100 font-bold mt-1">
                {user?.full_name || 'Operations Manager'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Division: <span className="text-emerald-400 font-bold">{user?.division_name || 'Northern Zone'}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Operations & Decision
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#8f1d2c] text-white shadow-sm shadow-[#8f1d2c]/40'
                          : item.highlight
                          ? 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border border-rose-700/40'
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
          <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="font-bold text-slate-200">Decision & Authority Hub</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Role: Operations Manager</div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] pb-20 md:pb-8 bg-[#f5f6f7]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      {/* Emergency Replan Modal Accessible to Manager */}
      <EmergencyReplanModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  )
}

export default ManagerLayout
