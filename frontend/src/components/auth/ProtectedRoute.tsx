import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext'
import { ShieldAlert, Train } from 'lucide-react'

export interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
          <Train className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-bold text-slate-400">Verifying Railway Authority Credentials...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export interface RoleRouteProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, hasRole, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!user || !hasRole(allowedRoles)) {
    const userDashboard = getRoleDashboardPath(user?.role)
    return (
      <div className="min-h-[450px] flex items-center justify-center p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md w-full text-center shadow-md space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">403 — Unauthorized Role Access</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Your active railway role (<strong className="text-slate-800 uppercase">{user?.role?.replace(/_/g, ' ')}</strong>) does not have clearance to view this workspace.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to={userDashboard}
              replace
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <span>Return to My Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export interface PermissionRouteProps {
  permission: string
  children: React.ReactNode
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { user, hasPermission, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!hasPermission(permission)) {
    const userDashboard = getRoleDashboardPath(user?.role)
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-1">
              You do not have permission to access this page. This operation requires elevated railway authority ({permission}).
            </p>
          </div>
          <Link
            to={userDashboard}
            replace
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <span>Go to My Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export interface CanProps {
  permission?: string
  role?: string | string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const Can: React.FC<CanProps> = ({ permission, role, fallback = null, children }) => {
  const { hasPermission, hasRole } = useAuth()

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (role) {
    const rolesArray = Array.isArray(role) ? role : [role]
    if (!hasRole(rolesArray)) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
