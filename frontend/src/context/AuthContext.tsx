import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, logoutUser, fetchCurrentUser, fetchDemoUsers } from '../services/api'

export type CanonicalRole = 'INSPECTOR' | 'MANAGER' | 'ENGINEER' | 'ADMIN'

export function toCanonicalRole(role?: string): CanonicalRole {
  if (!role) return 'INSPECTOR'
  const norm = role.trim().toUpperCase()
  if (norm === 'INSPECTOR' || norm === 'FIELD_INSPECTOR') return 'INSPECTOR'
  if (norm === 'MANAGER' || norm === 'OPERATIONS_MANAGER') return 'MANAGER'
  if (
    norm === 'ENGINEER' ||
    norm === 'MAINTENANCE_ENGINEER' ||
    norm === 'TRACK_USER' ||
    norm === 'SIGNAL_USER' ||
    norm === 'TRACTION_USER'
  ) {
    return 'ENGINEER'
  }
  if (norm === 'ADMIN' || norm === 'SYSTEM_ADMIN') return 'ADMIN'
  if (norm === 'AUDITOR_VIEWER') return 'INSPECTOR'
  return 'ENGINEER'
}

export function getRoleDashboardPath(role?: string): string {
  const c = toCanonicalRole(role)
  switch (c) {
    case 'INSPECTOR':
      return '/inspector/dashboard'
    case 'MANAGER':
      return '/manager/dashboard'
    case 'ENGINEER':
      return '/engineer/dashboard'
    case 'ADMIN':
      return '/admin/dashboard'
  }
}

export interface UserProfile {
  user_id: number
  employee_id: string
  email: string
  full_name: string
  role: string
  canonical_role?: string
  department: string
  division_name?: string
  section_code?: string
  last_login?: string
  permissions: string[]
}

export interface DemoUser {
  employee_id: string
  email: string
  full_name: string
  role: string
  department: string
  section_code?: string
  display_title: string
  description: string
}

interface AuthContextType {
  user: UserProfile | null
  canonicalRole: CanonicalRole
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  demoUsers: DemoUser[]
  login: (username: string, password?: string) => Promise<boolean>
  logout: () => Promise<void>
  switchRole: (email: string) => Promise<boolean>
  hasPermission: (perm: string) => boolean
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PERMISSION_ALIASES: Record<string, string[]> = {
  'planning:approve': ['plan:approve', 'planning:approve'],
  'plan:approve': ['plan:approve', 'planning:approve'],
  'planning:create': ['plan:create', 'planning:create'],
  'plan:create': ['plan:create', 'planning:create'],
  'planning:view': ['plan:view', 'planning:view'],
  'plan:view': ['plan:view', 'planning:view'],
  'planning:reject': ['plan:reject', 'planning:reject'],
  'plan:reject': ['plan:reject', 'planning:reject'],
  'planning:replan': ['plan:replan', 'planning:replan', 'replan:execute'],
  'issue:create': ['issue:create', 'maintenance:create'],
  'maintenance:create': ['issue:create', 'maintenance:create'],
  'issue:approve': ['issue:approve', 'issue:review', 'maintenance:approve', 'planning:approve'],
  'issue:reject': ['issue:reject', 'issue:review', 'planning:reject'],
  'issue:assign': ['issue:assign', 'issue:review', 'planning:create'],
  'issue:review': ['issue:review', 'issue:approve', 'planning:approve'],
  'execution:start': ['execution:update', 'execution:start', 'task:start'],
  'execution:complete': ['execution:update', 'execution:complete', 'task:complete'],
  'authority:contact': ['authority:contact', 'planning:approve', 'issue:review'],
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('railopt_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  })
  const [token, setToken] = useState<string | null>(localStorage.getItem('railopt_token'))
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])

  useEffect(() => {
    // Load demo users list for switcher
    fetchDemoUsers().then(setDemoUsers).catch(console.error)

    // Check existing session
    const savedToken = localStorage.getItem('railopt_token')
    if (savedToken) {
      fetchCurrentUser()
        .then((userData) => {
          setUser(userData)
          localStorage.setItem('railopt_user', JSON.stringify(userData))
        })
        .catch(() => {
          // Token invalid, clear local auth
          clearLocalSession()
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    // Listen to global force logout events from apiClient
    const handleLogoutEvent = () => {
      clearLocalSession()
    }
    window.addEventListener('railopt_logout', handleLogoutEvent)
    return () => window.removeEventListener('railopt_logout', handleLogoutEvent)
  }, [])

  const clearLocalSession = () => {
    localStorage.removeItem('railopt_token')
    localStorage.removeItem('railopt_refresh_token')
    localStorage.removeItem('railopt_user')
    setToken(null)
    setUser(null)
  }

  const login = async (username: string, password: string = 'RailOpt@2026'): Promise<UserProfile | null> => {
    try {
      setIsLoading(true)
      const data = await loginUser({ username, password })
      localStorage.setItem('railopt_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('railopt_refresh_token', data.refresh_token)
      }
      localStorage.setItem('railopt_user', JSON.stringify(data.user))
      setToken(data.access_token)
      setUser(data.user)
      return data.user
    } catch (err) {
      console.error('Login failed:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const switchRole = async (email: string): Promise<UserProfile | null> => {
    return login(email, 'RailOpt@2026')
  }

  const logout = async () => {
    try {
      await logoutUser()
    } catch (e) {
      // silent
    } finally {
      clearLocalSession()
    }
  }

  const hasPermission = (perm: string): boolean => {
    if (!user) return false
    if (user.role === 'SYSTEM_ADMIN') return true

    const normalized = perm.trim().replace('.', ':')
    const aliases = PERMISSION_ALIASES[normalized] || [normalized]

    const userPerms = (user.permissions || []).map((p) => p.trim().replace('.', ':'))
    return aliases.some((alias) => userPerms.includes(alias))
  }

  const canonicalRole = toCanonicalRole(user?.role)

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    if (user.role === 'SYSTEM_ADMIN' || canonicalRole === 'ADMIN') return true
    const normalizedRoles = roles.map((r) => r.trim().toUpperCase())
    return (
      normalizedRoles.includes(user.role.toUpperCase()) ||
      normalizedRoles.includes(canonicalRole)
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        canonicalRole,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        demoUsers,
        login,
        logout,
        switchRole,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
