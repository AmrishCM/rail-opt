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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Security RBAC Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            Roles &amp; Permissions Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review central role-based authorization matrix. Permissions are enforced directly on all backend API endpoints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Selector */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 px-1">
            Railway Roles ({roles.length})
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-800 text-center text-xs text-zinc-500">
                Loading roles...
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = selectedRole?.role_id === r.role_id
                return (
                  <button
                    key={r.role_id}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/40 text-zinc-100'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-zinc-100">{r.display_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {r.user_count} Users
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{r.description}</p>
                    <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-blue-400">
                      <Shield className="w-3 h-3" strokeWidth={1.5} />
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
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="p-5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-blue-400">
                    {selectedRole.name}
                  </span>
                  <h2 className="text-base font-semibold text-zinc-100 mt-0.5">
                    {selectedRole.display_name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{selectedRole.description}</p>
                </div>
                <div className="p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800 text-center">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                    Security Level
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-200">
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
                        className={`p-3 rounded-md border flex items-center justify-between transition-colors ${
                          granted
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-zinc-200'
                            : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-500'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                granted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {p.category}
                            </span>
                            <span className="font-medium text-zinc-200">{p.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 block">{p.code}</span>
                        </div>
                        {granted ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" strokeWidth={2} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-600 flex items-center justify-center shrink-0">
                            <X className="w-3 h-3" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 text-xs font-medium bg-zinc-900 border border-zinc-800 rounded-lg">
              Select a role to inspect its permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleManagement
