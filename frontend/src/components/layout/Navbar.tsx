import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Train, ShieldAlert, Cpu, Activity, Database, Sparkles } from 'lucide-react'

interface NavbarProps {
  onTriggerDemoStep?: (step: number) => void
  currentDemoStep?: number
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Brand & Problem Statement Badge */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">RailOpt-AI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Automatic Block Planning & Asset Availability</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center pl-4 border-l border-slate-200 space-x-3 text-xs text-slate-600">
            <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Solver: OR-Tools CP-SAT Ready
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-medium">Data: Synthetic/Demo</span>
          </div>
        </div>

        {/* Right: Quick Indicators & Demo Trigger */}
        <div className="flex items-center space-x-3">
          <Link
            to="/planner"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm transition-all"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Optimization Room</span>
          </Link>

          <Link
            to="/assistant"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Co-Pilot</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
