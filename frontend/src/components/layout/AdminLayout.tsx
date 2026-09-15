import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Header } from './Header'
import { MobileBottomNav } from './MobileBottomNav'
import { EmergencyReplanModal } from '../../pages/emergency/EmergencyReplanModal'
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  PhoneCall,
  Map,
  Sliders,
  BarChart3,
  FileText,
  Activity,
  User
} from 'lucide-react'

export const AdminLayout: React.FC = () => {
  const { user } = useAuth()
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/issues', label: 'Issues', icon: AlertTriangle },
    { to: '/admin/approval-planning', label: 'Approval & Planning', icon: ShieldCheck, highlight: true },
    { to: '/admin/timetable', label: 'Timetable', icon: Calendar },
    { to: '/admin/work-orders', label: 'Work Orders', icon: ClipboardCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/settings', label: 'Railway Configuration', icon: Sliders },
    { to: '/admin/authorities', label: 'Authorities', icon: PhoneCall },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/audit', label: 'Audit Trail', icon: FileText },
    { to: '/admin/diagnostics', label: 'System Telemetry', icon: Activity },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#172027] flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header onOpenEmergencyModal={() => setEmergencyModalOpen(true)} />

      <div className="flex-1 flex w-full">
        {/* Desktop / Tablet Sidebar (Hidden on Mobile < 768px) */}
        <aside className="hidden md:flex flex-col justify-between w-60 lg:w-64 bg-[#0f172a] border-r border-slate-800 shrink-0 min-h-[calc(100vh-64px)] text-slate-100">
          <div className="p-4 space-y-4">
            {/* Admin Identity Card */}
            <div className="p-3 bg-slate-900 rounded-xl border border-purple-900/40">
              <div className="flex items-center space-x-2 text-purple-400 font-extrabold text-xs">
                <Shield className="w-4 h-4 shrink-0" />
                <span className="truncate">Administrative Control</span>
              </div>
              <div className="text-[11px] text-slate-100 font-bold mt-1">
                {user?.full_name || 'System Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Privilege: <span className="text-purple-400 font-bold">Unrestricted / Audited</span>
              </div>
            </div>

            {/* Navigation Links with Scrollbar */}
            <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
                Administration Shell
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#8f1d2c] text-white shadow-sm shadow-[#8f1d2c]/40'
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
            <div className="font-bold text-slate-200">Central Railway Admin</div>
            <div className="text-[10px] text-slate-400 mt-0.5">All actions logged to audit trail</div>
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

      {/* Emergency Replan Modal */}
      <EmergencyReplanModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </div>
  )
}

export default AdminLayout
