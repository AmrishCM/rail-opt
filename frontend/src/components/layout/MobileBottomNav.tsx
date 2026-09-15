import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home,
  Clock,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Wrench,
  Users,
  Shield,
  FileText,
  Settings,
  Calendar,
  PhoneCall,
  UserCheck
} from 'lucide-react'

export const MobileBottomNav: React.FC = () => {
  const { canonicalRole } = useAuth()

  interface NavItem {
    to: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    isPrimary?: boolean
  }

  let items: NavItem[] = []

  if (canonicalRole === 'INSPECTOR') {
    items = [
      { to: '/inspector/dashboard', label: 'Home', icon: Home },
      { to: '/inspector/timetable', label: 'Timetable', icon: Calendar },
      { to: '/inspector/issues/new', label: 'Report', icon: PlusCircle, isPrimary: true },
      { to: '/inspector/issues', label: 'My Issues', icon: AlertTriangle },
      { to: '/inspector/issues/completed', label: 'Done', icon: CheckCircle2 },
    ]
  } else if (canonicalRole === 'MANAGER') {
    items = [
      { to: '/manager/dashboard', label: 'Dashboard', icon: Home },
      { to: '/manager/approvals', label: 'Approvals', icon: CheckCircle2, isPrimary: true },
      { to: '/manager/issues', label: 'Status', icon: Layers },
      { to: '/manager/replan', label: 'Replan', icon: Clock },
      { to: '/manager/contacts', label: 'Authority', icon: PhoneCall },
    ]
  } else if (canonicalRole === 'ENGINEER') {
    items = [
      { to: '/engineer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/engineer/work/pending', label: 'Work Queue', icon: Wrench, isPrimary: true },
      { to: '/engineer/work/approved', label: 'Approved', icon: CheckCircle2 },
      { to: '/engineer/issues/new', label: 'Report', icon: PlusCircle },
      { to: '/engineer/timetable', label: 'Timetable', icon: Calendar },
    ]
  } else {
    // ADMIN
    items = [
      { to: '/admin/dashboard', label: 'Admin', icon: Home },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/roles', label: 'Roles', icon: Shield },
      { to: '/admin/audit', label: 'Audit', icon: FileText },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Mobile Navigation Bar"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 py-1 rounded-xl transition-all ${
                  item.isPrimary
                    ? isActive
                      ? 'text-blue-600 font-extrabold scale-105'
                      : 'text-blue-600 font-bold'
                    : isActive
                    ? 'text-blue-600 font-bold bg-blue-50/80'
                    : 'text-slate-500 hover:text-slate-900 active:text-blue-600 font-medium'
                }`
              }
            >
              {item.isPrimary ? (
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md mb-0.5 -mt-3 ring-4 ring-white">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className="w-5 h-5 mb-0.5 shrink-0" />
              )}
              <span className="text-[10px] tracking-tight truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
