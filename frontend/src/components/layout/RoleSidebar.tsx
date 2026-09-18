import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home,
  Wrench,
  Layers,
  CheckCircle2,
  Map,
  BarChart3,
  Cpu,
  Users,
  FileText,
  Clock,
  Sliders,
  Camera,
  Settings,
  Shield,
  Zap,
  Radio,
  Compass
} from 'lucide-react'

export interface SidebarNavItem {
  to: string
  label: string
  icon: any
  permission?: string
}

export const RoleSidebar: React.FC = () => {
  const { user, hasPermission } = useAuth()
  const role = user?.role || 'MAINTENANCE_ENGINEER'

  // Build role-specific navigation menus with explicit, unabridged items
  let navItems: SidebarNavItem[] = []

  if (role === 'SYSTEM_ADMIN') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/admin/users', label: 'Users', icon: Users, permission: 'users:view' },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield, permission: 'roles:view' },
      { to: '/corridors', label: 'Departments & Assets', icon: Map, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Planning & Approvals', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
      { to: '/admin/audit', label: 'Audit Logs', icon: FileText, permission: 'system:audit' },
      { to: '/admin/settings', label: 'System Settings', icon: Settings, permission: 'system:settings' },
      { to: '/admin/diagnostics', label: 'Workflow Diagnostics', icon: Sliders, permission: 'system:settings' },
      { to: '/admin', label: 'Demo Controls', icon: Cpu, permission: 'system:settings' }
    ]
  } else if (role === 'OPERATIONS_MANAGER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Planning', icon: Layers, permission: 'planning:view' },
      { to: '/planner', label: 'Approvals', icon: CheckCircle2, permission: 'planning:approve' },
      { to: '/corridors', label: 'Corridors', icon: Map, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' }
    ]
  } else if (role === 'MAINTENANCE_ENGINEER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'My Work', icon: Wrench, permission: 'maintenance:view' },
      { to: '/maintenance/new', label: 'Report Maintenance', icon: FileText, permission: 'maintenance:create' },
      { to: '/planner', label: 'Plans', icon: Layers, permission: 'planning:view' },
      { to: '/corridors', label: 'Corridor 2D View', icon: Map, permission: 'planning:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' }
    ]
  } else if (role === 'TRACK_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'Track Assets', icon: Map, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Track Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Track Plans', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' }
    ]
  } else if (role === 'SIGNAL_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'S&T Assets', icon: Radio, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'S&T Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Shared Plans', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' }
    ]
  } else if (role === 'TRACTION_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'Traction Assets', icon: Zap, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Traction Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Power Blocks', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' }
    ]
  } else if (role === 'FIELD_INSPECTOR') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/execution', label: 'My Assignments', icon: Clock, permission: 'execution:view' },
      { to: '/execution', label: "Today's Work", icon: Wrench, permission: 'execution:view' },
      { to: '/corridors', label: 'Section Map', icon: Map, permission: 'maintenance:view' },
      { to: '/execution', label: 'Evidence', icon: Camera, permission: 'execution:update' }
    ]
  } else if (role === 'AUDITOR_VIEWER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/planner', label: 'Approved Plans', icon: Layers, permission: 'planning:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' }
    ]
  }

  // Filter items based on user permissions
  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-56px)] text-zinc-300 select-none">
      <div className="p-3 space-y-4">
        {/* User Scope Card */}
        <div className="p-3 bg-zinc-900/60 rounded-md border border-zinc-800/80">
          <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs">
            <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{user?.division_name?.split('(')[0] || 'Northern Zone'}</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Section: <span className="text-zinc-200 font-mono font-medium">{user?.section_code || 'C2-02'}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">
            {user?.role?.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider px-3 mb-1.5">
            Navigation
          </div>
          {visibleItems.map((item, idx) => {
            const Icon = item.icon
            return (
              <NavLink
                key={`${item.to}-${idx}`}
                to={item.to}
                end={item.to === '/'}
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

      {/* Footer operational scope */}
      <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500">
        <div className="font-medium text-zinc-400">RailOpt System</div>
        <div className="text-[10px] text-zinc-600 mt-0.5">Railway Operations Platform</div>
      </div>
    </aside>
  )
}

export default RoleSidebar
