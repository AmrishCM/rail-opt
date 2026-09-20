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
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Brand & Problem Statement Badge */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-600 transition-colors">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xl tracking-tight text-zinc-100">RailOpt-AI</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono">Automatic Block Planning & Asset Availability</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center pl-4 border-l border-zinc-800 space-x-3 text-xs text-zinc-400">
            <span className="inline-flex items-center text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Solver: OR-Tools CP-SAT Ready
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500 font-mono">Data: Synthetic/Demo</span>
          </div>
        </div>

        {/* Right: Quick Indicators & Demo Trigger */}
        <div className="flex items-center space-x-3">
          <Link
            to="/planner"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-800 text-zinc-200 text-xs font-mono hover:bg-zinc-700 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Optimization Room</span>
          </Link>

          <Link
            to="/assistant"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Co-Pilot</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
