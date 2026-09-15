import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Train,
  Shield,
  ArrowRight,
  Check,
  Sparkles,
  Lock,
  User,
  AlertCircle
} from 'lucide-react'

export const Login: React.FC = () => {
  const { login, demoUsers } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('engineer@railopt.demo')
  const [password, setPassword] = useState('RailOpt@2026')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const success = await login(username, password)
    if (success) {
      navigate('/')
    } else {
      setError('Invalid Employee ID / Email or Password. Please try again.')
    }
    setLoading(false)
  }

  const handleQuickDemoLogin = async (email: string) => {
    setUsername(email)
    setPassword('RailOpt@2026')
    setLoading(true)
    const success = await login(email, 'RailOpt@2026')
    if (success) {
      navigate('/')
    } else {
      setError('Quick login failed. Please check backend server.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Product Branding & Overview */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>RailOpt<span className="text-blue-400">-AI</span></span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Intelligent Railway Maintenance Block Planning & Coordination System
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Eliminates separate corridor closures by coordinating Engineering (Track), S&T (Signalling), and Traction (25kV OHE)
            into optimal joint maintenance blocks using Google OR-Tools CP-SAT.
          </p>

          <div className="space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Role-Based Access Control: Engineering, Operations, Field, Admin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>No AI/ML formulas exposed to normal railway engineers</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>100% deterministic offline demo resilience</span>
            </div>
          </div>
        </div>

        {/* Right: Login Card & 1-Click Demo Accounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white tracking-tight">Railway Employee Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter Employee ID or Email and Password</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Employee ID / Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. engineer@railopt.demo or EMP-ENG-003"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'SIGN IN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts (Section 15) */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Quick 1-Click Demo Logins:</span>
              <span className="text-[10px] text-amber-400 lowercase font-mono">pwd: RailOpt@2026</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'engineer@railopt.demo', label: 'Engineer Ravi' },
                { email: 'manager@railopt.demo', label: 'Manager Rajesh' },
                { email: 'inspector@railopt.demo', label: 'Inspector Manoj' },
                { email: 'admin@railopt.demo', label: 'Admin Suresh' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.email)}
                  className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left text-xs font-bold text-slate-200 transition-all truncate"
                >
                  <div className="text-[11px] font-black text-blue-400">{acc.label}</div>
                  <div className="text-[9px] text-slate-400 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Login
