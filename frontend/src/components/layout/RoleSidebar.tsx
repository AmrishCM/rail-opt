import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home,
  Wrench,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle2,
  Map,
  BarChart3,
  Cpu,
  Users,
  FileText,
  Clock,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Compass,
  Camera,
  Settings,
  Shield,
  Zap,
  Radio,
  Train
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

  // Build role-specific navigation menu matching Requirement 12
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
      { to: '/admin', label: 'Demo Controls', icon: Cpu, permission: 'system:settings' },
    ]
  } else if (role === 'OPERATIONS_MANAGER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Planning', icon: Layers, permission: 'planning:view' },
      { to: '/planner', label: 'Approvals', icon: CheckCircle2, permission: 'planning:approve' },
      { to: '/corridors', label: 'Corridors', icon: Map, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
    ]
  } else if (role === 'MAINTENANCE_ENGINEER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'My Work', icon: Wrench, permission: 'maintenance:view' },
      { to: '/maintenance/new', label: 'Report Maintenance', icon: FileCheck, permission: 'maintenance:create' },
      { to: '/planner', label: 'Plans', icon: Layers, permission: 'planning:view' },
      { to: '/corridors', label: 'Corridor 2D View', icon: Map, permission: 'planning:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
    ]
  } else if (role === 'TRACK_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'Track Assets', icon: Map, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Track Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Track Plans', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
    ]
  } else if (role === 'SIGNAL_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'S&T Assets', icon: Radio, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'S&T Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Shared Plans', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
    ]
  } else if (role === 'TRACTION_USER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/corridors', label: 'Traction Assets', icon: Zap, permission: 'maintenance:view' },
      { to: '/maintenance', label: 'Traction Maintenance', icon: Wrench, permission: 'maintenance:view' },
      { to: '/planner', label: 'Power Blocks', icon: Layers, permission: 'planning:view' },
      { to: '/execution', label: 'Execution', icon: Clock, permission: 'execution:view' },
    ]
  } else if (role === 'FIELD_INSPECTOR') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/execution', label: 'My Assignments', icon: Clock, permission: 'execution:view' },
      { to: '/execution', label: "Today's Work", icon: Wrench, permission: 'execution:view' },
      { to: '/corridors', label: 'Section Map', icon: Map, permission: 'maintenance:view' },
      { to: '/execution', label: 'Evidence', icon: Camera, permission: 'execution:update' },
    ]
  } else if (role === 'AUDITOR_VIEWER') {
    navItems = [
      { to: '/', label: 'Dashboard', icon: Home, permission: 'maintenance:view' },
      { to: '/planner', label: 'Approved Plans', icon: FileCheck, permission: 'planning:view' },
      { to: '/analytics', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
    ]
  }

  // Filter items based on user permissions
  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-110px)]">
      <div className="p-4 space-y-6">
        {/* User Scope Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-700 font-extrabold text-xs">
            <Compass className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{user?.division_name?.split('(')[0] || 'Northern Trunk'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Section: <strong className="text-slate-800 font-mono">{user?.section_code || 'C2-02'}</strong>
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5 uppercase tracking-wide">
            {user?.role?.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-2">
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
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
        <div className="font-bold text-slate-600">RailOpt-AI Platform</div>
        <div className="text-[10px] text-slate-400 mt-0.5">Indian Railways • SIH 2026</div>
      </div>
    </aside>
  )
}
