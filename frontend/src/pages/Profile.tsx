import React from 'react'
import { useAuth } from '../context/AuthContext'
import { UserCheck, Shield, MapPin, Building, Mail, Clock, Calendar, Lock } from 'lucide-react'

export const Profile: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Railway Employee Profile</h1>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            ACCOUNT DETAILS
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified railway operational credentials and organizational data scope.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 border-2 border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-lg">
            {user?.full_name ? user.full_name.charAt(0) : 'R'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black">{user?.full_name || 'Ravi Verma'}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                {user?.employee_id || 'EMP-ENG-003'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-blue-200 mt-1">
              <span className="font-bold">{user?.role?.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span>{user?.department}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <Mail className="w-3.5 h-3.5" />
              <span>Official Email</span>
            </div>
            <div className="font-bold text-slate-900 font-mono">{user?.email}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Operational Role</span>
            </div>
            <div className="font-extrabold text-blue-700 flex items-center space-x-1.5">
              <span>{user?.role?.replace(/_/g, ' ')}</span>
              <Lock className="w-3 h-3 text-slate-400" title="Assigned by Administrator (Read-Only)" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <Building className="w-3.5 h-3.5" />
              <span>Assigned Division</span>
            </div>
            <div className="font-bold text-slate-900">{user?.division_name || 'Northern Trunk Division'}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Section Scope</span>
            </div>
            <div className="font-mono font-bold text-slate-900">{user?.section_code || 'ALL'}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Login Session</span>
            </div>
            <div className="font-mono text-slate-700">
              {user?.last_login ? new Date(user.last_login).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Active now'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px]">
              <Shield className="w-3.5 h-3.5" />
              <span>Access Control Policy</span>
            </div>
            <div className="font-bold text-emerald-700">Role-Based Access Control (RBAC)</div>
          </div>
        </div>

        {/* Granted Permissions Pills */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30 space-y-3 text-xs">
          <div className="font-bold uppercase tracking-wide text-slate-500 text-[10px]">
            Granted System Permissions ({user?.permissions?.length || 0})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {user?.permissions?.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[10px] text-slate-700 font-bold shadow-2xs"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
