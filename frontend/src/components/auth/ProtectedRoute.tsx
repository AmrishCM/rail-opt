import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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

export interface PermissionRouteProps {
  permission: string
  children: React.ReactNode
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { hasPermission, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!hasPermission(permission)) {
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
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
