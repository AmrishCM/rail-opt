import React, { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, logoutUser, fetchCurrentUser, fetchDemoUsers } from '../services/api'

export interface UserProfile {
  user_id: number
  employee_id: string
  email: string
  full_name: string
  role: string
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
  'execution:start': ['execution:update', 'execution:start'],
  'execution:complete': ['execution:update', 'execution:complete'],
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

  const login = async (username: string, password: string = 'RailOpt@2026'): Promise<boolean> => {
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
      return true
    } catch (err) {
      console.error('Login failed:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const switchRole = async (email: string): Promise<boolean> => {
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

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false
    if (user.role === 'SYSTEM_ADMIN') return true
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
