import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, getRoleDashboardPath, toCanonicalRole } from '../../context/AuthContext'
import { useRealtime } from '../../context/RealtimeContext'
import { fetchNotifications, markNotificationRead } from '../../services/api'
import {
  Train,
  Bell,
  UserCheck,
  HelpCircle,
  AlertOctagon,
  LogOut,
  ChevronDown,
  Shield,
  Search,
  Check,
  Layers,
  X
} from 'lucide-react'

export interface HeaderProps {
  onOpenEmergencyModal: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenEmergencyModal }) => {
  const { user, demoUsers, switchRole, logout } = useAuth()
  const { isConnected, onlineUsers } = useRealtime()
  const navigate = useNavigate()
  const location = useLocation()

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(() => {
      loadNotifications()
    }, 15000)
    return () => clearInterval(interval)
  }, [user])

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data?.items || [])
      setUnreadCount(data?.unread_count || 0)
    } catch {
      // silent
    }
  }

  const handleSwitchUser = async (email: string) => {
    const updated = await switchRole(email)
    setRoleModalOpen(false)
    if (updated) {
      navigate(getRoleDashboardPath(updated.role))
    } else {
      navigate('/')
    }
  }

  const handleNotificationClick = async (n: any) => {
    try {
      await markNotificationRead(n.notification_id)
      loadNotifications()
    } catch {}
    setNotifOpen(false)
    if (n.link) {
      navigate(n.link)
    }
  }

  // Derive humanized operational breadcrumbs from current route
  const getBreadcrumb = () => {
    const p = location.pathname
    const canonical = toCanonicalRole(user?.role)
    const roleLabel =
      canonical === 'INSPECTOR'
        ? 'Field Inspector'
        : canonical === 'MANAGER'
        ? 'Operations Manager'
        : canonical === 'ENGINEER'
        ? 'Maintenance Engineer'
        : 'System Admin'

    let pageLabel = 'Overview'
    if (p.includes('timetable')) pageLabel = 'Timetable'
    else if (p.includes('track-view')) pageLabel = 'Track Schematic'
    else if (p.includes('report-issue') || p.includes('new')) pageLabel = 'Report Issue'
    else if (p.includes('issues') || p.includes('work-queue')) pageLabel = 'Active Issues'
    else if (p.includes('completed')) pageLabel = 'Completed Records'
    else if (p.includes('approval-planning')) pageLabel = 'Approval & Planning'
    else if (p.includes('status')) pageLabel = 'Issue Statuses'
    else if (p.includes('replan')) pageLabel = 'Replanning'
    else if (p.includes('resources')) pageLabel = 'Assets & Machinery'
    else if (p.includes('authorities')) pageLabel = 'Authority Coordination'
    else if (p.includes('audit')) pageLabel = 'Compliance Audit'
    else if (p.includes('notifications')) pageLabel = 'Alerts & Logs'
    else if (p.includes('profile')) pageLabel = 'Profile'

    return { roleLabel, pageLabel }
  }

  const { roleLabel, pageLabel } = getBreadcrumb()

  const roleHelpContent: Record<string, { title: string; bullets: string[] }> = {
    MAINTENANCE_ENGINEER: {
      title: 'Maintenance Engineer Workflow',
      bullets: [
        '1. Log track, signal, or OHE defects directly from field reports.',
        '2. Review AI urgency scores derived from safety constraints and asset criticality.',
        '3. Inspect recommended coordinated block windows.',
        '4. Submit finalized block requests to Operations Manager for authorization.'
      ]
    },
    OPERATIONS_MANAGER: {
      title: 'Operations Manager Workflow',
      bullets: [
        '1. Review incoming AI-generated maintenance block schedules.',
        '2. Verify train corridor availability, conflict detection, and sectional headway.',
        '3. Authorize track possession or request adjustments with operational notes.',
        '4. Trigger dynamic replanning in response to unplanned field failures or delays.'
      ]
    },
    FIELD_INSPECTOR: {
      title: 'Field Inspector Workflow',
      bullets: [
        '1. View active section assignments and scheduled maintenance windows.',
        '2. Record work commencement upon receiving track possession authority.',
        '3. Attach completion evidence, ultrasonic test logs, and photographic records.',
        '4. Mark work verified to clear track blocks in the dynamic timetable.'
      ]
    },
    SYSTEM_ADMIN: {
      title: 'System Administrator Workflow',
      bullets: [
        '1. Inspect CP-SAT optimization telemetry and solver iteration diagnostics.',
        '2. Audit state-machine logs and compliance records across all divisions.',
        '3. Manage system roles, permissions, and deterministic evaluation states.'
      ]
    }
  }

  const currentHelp =
    roleHelpContent[user?.role || 'MAINTENANCE_ENGINEER'] || roleHelpContent.MAINTENANCE_ENGINEER

  return (
    <>
      {/* Persistent Enterprise Top Bar (Row 1) */}
      <header className="bg-zinc-950 border-b border-zinc-800 text-zinc-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          {/* Left: Brand Logo & Navigation Breadcrumb */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to={getRoleDashboardPath(user?.role)}
              className="flex items-center space-x-2.5 group focus-visible:outline-none"
            >
              <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 transition-colors group-hover:border-zinc-700">
                <Train className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="font-bold text-sm tracking-tight text-zinc-100 font-mono">
                RAILOPT
              </span>
            </Link>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            {/* Clean Breadcrumb Hierarchy */}
            <nav className="hidden sm:flex items-center space-x-1.5 text-xs text-zinc-400">
              <span>Operations</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-300 font-medium">{roleLabel}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-100 font-semibold">{pageLabel}</span>
            </nav>
          </div>

          {/* Center: Minimal Command / Search Box */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues, blocks, assets..."
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md pl-9 pr-14 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:bg-zinc-900 focus:border-zinc-700 focus:outline-none transition-colors"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="text-[10px] font-mono text-zinc-500 px-1 py-0.5 rounded border border-zinc-800 bg-zinc-950">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right: Realtime status, Emergency (Manager/Admin), Notifications, User Menu */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Realtime Connected Indicator: Single Accent Color Only */}
            <div
              className="flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs text-zinc-400 select-none hover:bg-zinc-900/60 transition-colors"
              title={
                isConnected
                  ? `Live bus connected (${onlineUsers.length} operators active)`
                  : 'Reconnecting to event bus...'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-blue-500' : 'bg-amber-500 animate-ping'
                }`}
              />
              <span className="text-[11px] font-medium hidden sm:inline">
                {isConnected ? 'Live' : 'Syncing'}
              </span>
            </div>

            {/* Quick Emergency Defect Action (Manager & Admin only, no flashy glow) */}
            {['MANAGER', 'ADMIN'].includes(toCanonicalRole(user?.role)) && (
              <button
                onClick={onOpenEmergencyModal}
                className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors active:translate-y-[1px]"
                title="Trigger dynamic replan for critical track or signalling failure"
              >
                <AlertOctagon className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Critical Defect</span>
              </button>
            )}

            {/* Role Switcher Button */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors active:translate-y-[1px]"
              title="Switch operational demo role"
            >
              <Shield className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
              <span className="truncate max-w-[110px] hidden sm:inline">
                {user?.role ? user.role.replace(/_/g, ' ') : 'Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
            </button>

            {/* Notifications Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-8 h-8 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors relative active:translate-y-[1px]"
                title="Operational Notifications"
              >
                <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 text-zinc-100 rounded-lg shadow-2xl border border-zinc-800 py-2 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3.5 py-2 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/60 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-xs">
                        No active notifications
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.notification_id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 cursor-pointer hover:bg-zinc-800/60 transition-colors ${
                            !n.is_read ? 'bg-zinc-800/30' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium text-zinc-200 text-xs">
                            <span className="truncate">{n.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                              {n.created_at
                                ? new Date(n.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-zinc-800 text-center">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-zinc-400 hover:text-zinc-200 py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 pl-1.5 pr-2 py-1 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 transition-colors text-xs active:translate-y-[1px]"
                title="Account Menu"
              >
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-medium text-zinc-200 text-[11px]">
                  {user?.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <span className="font-medium hidden md:inline truncate max-w-[100px] text-zinc-300">
                  {user?.full_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 text-zinc-100 rounded-lg shadow-2xl border border-zinc-800 py-2 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-zinc-800">
                    <p className="font-semibold text-xs text-zinc-200 truncate">
                      {user?.full_name || 'Operator'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {user?.email || 'operator@railopt.demo'}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {user?.role ? user.role.replace(/_/g, ' ') : 'USER'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {user?.section_code || user?.department || 'Operational'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-3.5 py-2 hover:bg-zinc-800/60 text-zinc-300 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      <span>Profile Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        setHelpModalOpen(true)
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-zinc-800/60 text-zinc-300 transition-colors text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      <span>Workflow Guide</span>
                    </button>
                  </div>

                  <div className="border-t border-zinc-800 pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        setLogoutConfirmOpen(true)
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-zinc-800/60 text-red-400 font-medium text-left text-xs transition-colors"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-sm w-full border border-zinc-800 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Sign out of RailOpt?</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Your operational session will be closed. Re-authenticate to access maintenance plans, execution logs, and approvals.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Role Switcher Modal (Sentence Case, Clean Neutral Treatment) */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 rounded-lg shadow-2xl max-w-xl w-full p-6 border border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Switch Operational Role
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select an authenticated railway role to view its dedicated workflow and permissions.
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 max-h-[60vh] overflow-y-auto">
              {demoUsers.map((u) => {
                const isActive = user?.email === u.email
                return (
                  <button
                    key={u.email}
                    onClick={() => handleSwitchUser(u.email)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      isActive
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-200">
                        {u.display_title}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-blue-400" strokeWidth={2} />}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{u.full_name}</div>
                    <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-tight">
                      {u.description}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>All accounts use deterministic operational test records.</span>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Workflow Guide Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 rounded-lg shadow-2xl max-w-lg w-full p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-semibold uppercase text-zinc-400 tracking-wider">
                  Operational Reference
                </span>
                <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
                  {currentHelp.title}
                </h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-300 space-y-1.5">
              <p className="font-medium text-zinc-200">
                Coordinated Track, Signalling & Traction Scheduling
              </p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                RailOpt optimizes maintenance block possessions to eliminate headway conflicts while maintaining safety integrity.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider">
                Workflow Actions:
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {currentHelp.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-400 font-mono shrink-0">•</span>
                    <span className="leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-zinc-800 text-right">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header
