import React, { useState, useEffect } from 'react'
import { Shield, Check, X, Users, Lock, Info } from 'lucide-react'
import { fetchRoles } from '../../services/api'

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedRole, setSelectedRole] = useState<any | null>(null)

  const ALL_SYSTEM_PERMISSIONS = [
    { code: 'maintenance:view', label: 'View Maintenance & Defects', category: 'Maintenance' },
    { code: 'maintenance:create', label: 'Log Maintenance Requests', category: 'Maintenance' },
    { code: 'maintenance:update', label: 'Edit Maintenance Details', category: 'Maintenance' },
    { code: 'maintenance:delete', label: 'Archive / Delete Requests', category: 'Maintenance' },
    { code: 'planning:view', label: 'View Coordinated Block Plans', category: 'Planning' },
    { code: 'planning:create', label: 'Generate AI Recommendations', category: 'Planning' },
    { code: 'planning:approve', label: 'Approve Track Possessions', category: 'Planning' },
    { code: 'planning:reject', label: 'Reject / Request Changes', category: 'Planning' },
    { code: 'planning:replan', label: 'Execute Dynamic Replanning', category: 'Planning' },
    { code: 'execution:view', label: 'View Execution Records', category: 'Field Execution' },
    { code: 'execution:start', label: 'Mark Possession Started', category: 'Field Execution' },
    { code: 'execution:update', label: 'Upload Evidence & Notes', category: 'Field Execution' },
    { code: 'execution:complete', label: 'Sign Off Work Completion', category: 'Field Execution' },
    { code: 'emergency:create', label: 'Report Emergency Defect', category: 'Safety' },
    { code: 'reports:view', label: 'View Operational KPI Reports', category: 'Reports' },
    { code: 'users:view', label: 'View User Accounts', category: 'Administration' },
    { code: 'users:create', label: 'Provision User Accounts', category: 'Administration' },
    { code: 'users:update', label: 'Edit User Roles & Scopes', category: 'Administration' },
    { code: 'users:disable', label: 'Deactivate User Accounts', category: 'Administration' },
    { code: 'roles:view', label: 'Inspect RBAC Matrix', category: 'Administration' },
    { code: 'system:settings', label: 'Configure Solver Weights', category: 'System' },
    { code: 'system:audit', label: 'Inspect Security Audit Logs', category: 'System' },
  ]

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const data = await fetchRoles()
      setRoles(data || [])
      if (data && data.length > 0) {
        setSelectedRole(data[0])
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
    } finally {
      setLoading(false)
    }
  }

  const roleHasPermission = (role: any, permCode: string): boolean => {
    if (!role) return false
    if (role.name === 'SYSTEM_ADMIN') return true
    return (role.permissions || []).includes(permCode)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Roles & Permissions</h1>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            SECURITY RBAC MATRIX
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Review central role-based authorization matrix. Permissions are enforced directly on all backend API endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Railway Roles ({roles.length})
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-bold">
                Loading roles...
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = selectedRole?.role_id === r.role_id
                return (
                  <button
                    key={r.role_id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{r.display_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {r.user_count} Users
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
                    <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-blue-700 font-bold">
                      <Shield className="w-3 h-3" />
                      <span>{r.permissions.length} Permissions Granted</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Permission Matrix for Selected Role */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRole ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-blue-700 font-mono">
                    {selectedRole.name}
                  </span>
                  <h2 className="text-base font-black text-slate-900 mt-0.5">
                    {selectedRole.display_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                  <span className="text-xs font-mono font-bold text-slate-500 block text-[9px] uppercase">
                    Security Level
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {selectedRole.name === 'SYSTEM_ADMIN'
                      ? 'Level 4 (Root)'
                      : selectedRole.name === 'OPERATIONS_MANAGER'
                      ? 'Level 3 (Division)'
                      : 'Level 2 (Section)'}
                  </span>
                </div>
              </div>

              {/* Permission Checklist */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_SYSTEM_PERMISSIONS.map((p) => {
                    const granted = roleHasPermission(selectedRole, p.code)
                    return (
                      <div
                        key={p.code}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          granted
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                granted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {p.category}
                            </span>
                            <span className="font-bold">{p.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">{p.code}</span>
                        </div>
                        {granted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">
              Select a role to inspect its permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleManagement
