import React from 'react'
import { useAuth } from '../context/AuthContext'
import { UserCheck, Shield, MapPin, Building, Mail, Clock, Calendar, Lock } from 'lucide-react'

export const Profile: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 font-mono text-[11px] uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Account Details &bull; Credentials</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">Railway Employee Profile</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Verified railway operational credentials and organizational data scope
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        {/* Banner */}
        <div className="bg-zinc-950/80 p-6 text-zinc-100 flex items-center space-x-4 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-lg bg-blue-600 border border-blue-500/30 flex items-center justify-center font-semibold text-xl text-white shadow-sm">
            {user?.full_name ? user.full_name.charAt(0) : 'R'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-zinc-100">{user?.full_name || 'Ravi Verma'}</h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user?.employee_id || 'EMP-ENG-003'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
              <span className="font-medium text-zinc-300">{user?.role?.replace(/_/g, ' ')}</span>
              <span>&bull;</span>
              <span>{user?.department}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Official Email</span>
            </div>
            <div className="font-mono text-zinc-200">{user?.email}</div>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Operational Role</span>
            </div>
            <div className="font-medium text-blue-400 flex items-center space-x-1.5">
              <span>{user?.role?.replace(/_/g, ' ')}</span>
              <Lock className="w-3 h-3 text-zinc-500" title="Assigned by Administrator (Read-Only)" />
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <Building className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Assigned Division</span>
            </div>
            <div className="text-zinc-200 font-medium">{user?.division_name || 'Northern Trunk Division'}</div>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Section Scope</span>
            </div>
            <div className="font-mono text-zinc-200">{user?.section_code || 'ALL'}</div>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Last Login Session</span>
            </div>
            <div className="font-mono text-zinc-400">
              {user?.last_login ? new Date(user.last_login).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Active now'}
            </div>
          </div>

          <div className="p-3.5 rounded-md border border-zinc-800 bg-zinc-950/60 space-y-1">
            <div className="flex items-center space-x-2 text-zinc-500 font-mono uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Access Control Policy</span>
            </div>
            <div className="font-medium text-emerald-400">Role-Based Access Control (RBAC)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
