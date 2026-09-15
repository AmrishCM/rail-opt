import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, DemoUser, getRoleDashboardPath, toCanonicalRole } from '../../context/AuthContext'
import { useRealtime } from '../../context/RealtimeContext'
import { fetchNotifications, markNotificationRead, fetchDatabaseHealth } from '../../services/api'
import {
  Train,
  Bell,
  UserCheck,
  HelpCircle,
  AlertOctagon,
  LogOut,
  ChevronDown,
  Shield,
  Activity,
  Check,
  Sparkles,
  Layers,
  Clock,
  Database,
  X
} from 'lucide-react'

export interface HeaderProps {
  onOpenEmergencyModal: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenEmergencyModal }) => {
  const { user, demoUsers, switchRole, logout } = useAuth()
  const { connectionStatus, isConnected, onlineUsers } = useRealtime()
  const navigate = useNavigate()

  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [helpModalOpen, setHelpModalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; type: string; latency_ms: number } | null>(null)

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    loadNotifications()
    loadDbHealth()
    const interval = setInterval(() => {
      loadNotifications()
      loadDbHealth()
    }, 15000)
    return () => clearInterval(interval)
  }, [user])

  const loadDbHealth = async () => {
    try {
      const data = await fetchDatabaseHealth()
      if (data?.database) {
        setDbHealth(data.database)
      } else if (data?.connected !== undefined) {
        setDbHealth(data)
      }
    } catch (e) {
      setDbHealth({ connected: false, type: 'unknown', latency_ms: 0 })
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data.items || [])
      setUnreadCount(data.unread_count || 0)
    } catch (e) {
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
    } catch (e) {}
    setNotifOpen(false)
    if (n.link) {
      navigate(n.link)
    }
  }

  const roleHelpContent: Record<string, { title: string; bullets: string[] }> = {
    MAINTENANCE_ENGINEER: {
      title: 'Engineer Workflow Guide',
      bullets: [
        '1. Click "New Maintenance" to log a track, signal, or OHE defect.',
        '2. Review the AI Urgency score (calculated from safety & asset criticality).',
        '3. Click "Generate Maintenance Plan" to get a recommended coordinated block.',
        '4. Review task assignments and submit the plan to the Operations Manager for approval.'
      ]
    },
    OPERATIONS_MANAGER: {
      title: 'Operations Manager Workflow Guide',
      bullets: [
        '1. Check "Action Required" on your dashboard for AI plans awaiting approval.',
        '2. Review corridor train movements, safety margins, and department coordination.',
        '3. Click "Approve Plan" to authorize corridor possession, or "Request Changes" with specific notes.',
        '4. In case of unexpected signal/track failures, click "Report Critical Defect" to trigger an automated replan.'
      ]
    },
    FIELD_INSPECTOR: {
      title: 'Field Inspector Guide',
      bullets: [
        '1. View today’s assigned maintenance blocks on Section C2-02.',
        '2. Click "Start Work" to record possession start time.',
        '3. Upload post-welding ultrasonic inspection photos or track clearance evidence.',
        '4. Click "Complete Work" with actual duration and completion notes.'
      ]
    },
    SYSTEM_ADMIN: {
      title: 'System Administrator Guide',
      bullets: [
        '1. Access the CP-SAT optimization engine telemetry and branch statistics.',
        '2. Review complete compliance audit logs.',
        '3. Click "Reset Demo Scenario" at any time to restore the deterministic SIH evaluation state.'
      ]
    }
  }

  const currentHelp = roleHelpContent[user?.role || 'MAINTENANCE_ENGINEER'] || roleHelpContent.MAINTENANCE_ENGINEER

  return (
    <>
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Brand Logo & Product Name */}
          <div className="flex items-center space-x-3">
            <Link to={getRoleDashboardPath(user?.role)} className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-base tracking-tighter">
                <Train className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-tight text-white leading-none">
                    RailOpt<span className="text-blue-400">-AI</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-400/20">
                    SIH 2026
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Intelligent Railway Maintenance Planning & Coordination
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Global Status Bar (Section 42) */}
          <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">{user?.full_name || 'Engineer Ravi Verma'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-blue-400 font-bold">{user?.department || 'Engineering/Track'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">{user?.section_code || 'C2-02'}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Status: <strong className="text-emerald-400">Operational</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Database:</span>
                {dbHealth?.connected ? (
                  dbHealth.type === 'postgresql' ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Connected</span>
                      <span className="text-[9px] text-slate-400 font-normal">({dbHealth.latency_ms}ms)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>SQLite Development Mode</span>
                      <span className="text-[9px] text-slate-400 font-normal">({dbHealth.latency_ms}ms)</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center space-x-1 text-rose-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Disconnected</span>
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right: Actions, Role Switcher, Notifications, Help */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Realtime WebSocket Connection Status (Section 11 & 61) */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                  ? 'bg-amber-950/70 text-amber-300 border-amber-700/80 animate-pulse'
                  : 'bg-rose-950/70 text-rose-300 border-rose-700/80'
              }`}
              title={
                isConnected
                  ? 'Realtime event bus connected. All users see live updates without refresh.'
                  : 'Connecting to server event bus... Operations polling active.'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="hidden md:inline">Realtime:</span>
              <span>{isConnected ? '● Connected' : '○ Reconnecting...'}</span>
              {onlineUsers.length > 0 && (
                <span className="hidden xl:inline text-[10px] text-slate-400 font-normal pl-1 border-l border-slate-700">
                  {onlineUsers.length} online
                </span>
              )}
            </div>

            {/* Quick Emergency Defect Button (Manager & Admin only) */}
            {['MANAGER', 'ADMIN'].includes(toCanonicalRole(user?.role)) && (
              <button
                onClick={onOpenEmergencyModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm shadow-red-500/20"
                title="Report unexpected critical condition to trigger dynamic replanning"
              >
                <AlertOctagon className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline">Emergency Defect</span>
              </button>
            )}

            {/* 1-Click Role Switcher */}
            <button
              onClick={() => setRoleModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold truncate max-w-[120px]">{user?.role?.replace('_', ' ') || 'ENGINEER'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Operations Notifications
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} Unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">No notifications right now</div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.notification_id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                            !n.is_read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                            <span className="truncate">{n.title}</span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-normal">
                              {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Account Menu (Section 14 & 42) */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all text-xs"
                title="Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-[11px]">
                  {user?.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <span className="font-bold hidden md:inline truncate max-w-[100px]">
                  {user?.full_name?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-black text-xs text-slate-900 truncate">{user?.full_name}</p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {user?.role?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {user?.section_code || user?.department}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 text-xs">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/maintenance"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>My Work</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        setHelpModalOpen(true)
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>Workflow Guide</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        setLogoutConfirmOpen(true)
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-red-50 text-red-600 font-bold text-left text-xs transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal (Section 15 & 41) */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Sign out of RailOpt-AI?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your operational session will be closed. You will need to sign in again to access maintenance plans, execution logs, and approvals.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Role Switcher Modal (Section 15: Demo Accounts) */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Switch Operational Role (1-Click Demo)</h3>
                <p className="text-xs text-slate-500">
                  Select a railway role to view its dedicated workflow, permissions, and dashboard.
                </p>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 max-h-[60vh] overflow-y-auto">
              {demoUsers.map((u) => {
                const isActive = user?.email === u.email
                return (
                  <button
                    key={u.email}
                    onClick={() => handleSwitchUser(u.email)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{u.display_title}</span>
                      {isActive && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-[11px] font-semibold text-blue-700 mt-0.5">{u.full_name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{u.description}</div>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Default password for all accounts: <strong>RailOpt@2026</strong></span>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Help Modal (Section 39 & 40) */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">How this works</span>
                <h3 className="text-lg font-black text-slate-900">{currentHelp.title}</h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-2">
              <p className="font-semibold">
                RailOpt-AI coordinates track, signalling, and traction maintenance automatically behind the scenes.
              </p>
              <p className="text-blue-800">
                You do not need to understand optimization algorithms, machine learning models, or mathematical formulas to use this application.
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-500">Your Action Steps:</h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {currentHelp.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
