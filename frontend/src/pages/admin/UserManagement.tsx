import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Power,
  RefreshCw,
  X
} from 'lucide-react'
import {
  fetchUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword
} from '../../services/api'

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [editModalUser, setEditModalUser] = useState<any | null>(null)
  const [resetModalUser, setResetModalUser] = useState<any | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Form states
  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('MAINTENANCE_ENGINEER')
  const [newDepartment, setNewDepartment] = useState('Engineering/Track')
  const [newSection, setNewSection] = useState('C2')

  // Password reset state
  const [tempPassword, setTempPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [roleFilter, departmentFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await fetchUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        department: departmentFilter || undefined,
      })
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers()
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser({
        employee_id: newEmployeeId,
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDepartment,
        section_code: newSection,
      })
      setActionSuccessMessage(`User ${newEmployeeId} created successfully.`)
      setCreateModalOpen(false)
      // Reset form
      setNewEmployeeId('')
      setNewFullName('')
      setNewEmail('')
      setNewPassword('')
      loadUsers()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create user')
    }
  }

  const handleToggleStatus = async (user: any) => {
    try {
      await toggleUserStatus(user.user_id, !user.is_active)
      setActionSuccessMessage(`User ${user.employee_id} status updated.`)
      loadUsers()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to change status')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalUser || !tempPassword) return
    try {
      await resetUserPassword(resetModalUser.user_id, tempPassword)
      setActionSuccessMessage(`Password reset successfully for ${resetModalUser.employee_id}.`)
      setResetModalUser(null)
      setTempPassword('')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to reset password')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">User Management</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure railway staff accounts, assign operational roles, and enforce departmental data scopes.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Employee ID, Name, or Email..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">System Administrator</option>
            <option value="OPERATIONS_MANAGER">Operations Manager</option>
            <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
            <option value="TRACK_USER">Track Supervisor</option>
            <option value="SIGNAL_USER">S&T Engineer</option>
            <option value="TRACTION_USER">Traction Foreman</option>
            <option value="FIELD_INSPECTOR">Field Inspector</option>
            <option value="AUDITOR_VIEWER">Safety Auditor</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <option value="">All Departments</option>
            <option value="Engineering/Track">Engineering/Track</option>
            <option value="S&T/Signalling">S&T/Signalling</option>
            <option value="Traction Distribution">Traction Distribution</option>
            <option value="Operating Department">Operating Department</option>
            <option value="Safety Directorate">Safety Directorate</option>
            <option value="Railway Board / IT">Railway Board / IT</option>
          </select>

          <button
            onClick={loadUsers}
            className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department & Division</th>
                <th className="py-3 px-4">Section Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    Loading users database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {u.employee_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{u.department}</div>
                      <div className="text-[10px] text-slate-400">{u.division_name || 'All Divisions'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-600">
                      {u.section_code || 'ALL'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-red-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]"
                        title="Reset Password"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2 py-1 font-bold rounded-lg text-[10px] ${
                          u.is_active
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={u.is_active ? 'Disable Account' : 'Enable Account'}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Create New Railway User
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-ENG-042"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Anand Sharma"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="anand@railopt.demo"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="MAINTENANCE_ENGINEER">Maintenance Engineer</option>
                    <option value="OPERATIONS_MANAGER">Operations Manager</option>
                    <option value="TRACK_USER">Track Supervisor</option>
                    <option value="SIGNAL_USER">S&T Engineer</option>
                    <option value="TRACTION_USER">Traction Foreman</option>
                    <option value="FIELD_INSPECTOR">Field Inspector</option>
                    <option value="AUDITOR_VIEWER">Safety Auditor</option>
                    <option value="SYSTEM_ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Engineering/Track">Engineering/Track</option>
                    <option value="S&T/Signalling">S&T/Signalling</option>
                    <option value="Traction Distribution">Traction Distribution</option>
                    <option value="Operating Department">Operating Department</option>
                    <option value="Safety Directorate">Safety Directorate</option>
                    <option value="Railway Board / IT">Railway Board / IT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Code Scope</label>
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. C2-02 or ALL"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">
                Reset Password: {resetModalUser.employee_id}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Enter a temporary password for <strong>{resetModalUser.full_name}</strong>. Their active sessions will be invalidated immediately.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="New temporary password..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
