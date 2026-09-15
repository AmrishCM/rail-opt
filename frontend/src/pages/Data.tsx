import React, { useState } from 'react'
import { reseedDatabase } from '../services/api'
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  FileText,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'

export const Data: React.FC = () => {
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<any | null>(null)

  const handleReseed = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await reseedDatabase(7)
      setSeedResult(res)
    } catch (err) {
      console.error('Failed to seed:', err)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Data Ingestion & Synthetic Dataset Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Download CSV import templates, inspect synthetic corridor datasets, or reset demonstration seeds.
          </p>
        </div>

        <button
          onClick={handleReseed}
          disabled={seeding}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'SEEDING DATABASE...' : 'RE-SEED DEMO DATASET'}</span>
        </button>
      </div>

      {/* Dataset Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold block text-sm">Synthetic Demo Dataset Notice (SIH 2026 Protocol)</span>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            All corridors, train movement timetables, defect lists, and maintenance possession slots in RailOpt-AI are
            synthetically generated to reflect real Indian Railways operational dynamics. No official proprietary or
            classified Indian Railways operational data is deployed or claimed.
          </p>
        </div>
      </div>

      {seedResult && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{seedResult.message}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700">
            Assets: {seedResult.counts?.assets} • Tasks: {seedResult.counts?.maintenance_tasks} • Blocks: {seedResult.counts?.block_windows}
          </span>
        </div>
      )}

      {/* Downloadable Templates Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <Download className="w-4 h-4 text-slate-500" />
          <span>Downloadable Railway Ingestion Templates</span>
        </h3>
        <p className="text-xs text-slate-500">
          Standardized CSV schema templates formatted for maintenance defect logging, asset inventories, and block possession booking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <a
            href="/api/data/templates/maintenance_tasks_template.csv"
            download
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center space-x-3 text-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">maintenance_tasks.csv</span>
              <span className="text-[10px] text-slate-400">Defects, severity, duration</span>
            </div>
          </a>

          <a
            href="/api/data/templates/assets_template.csv"
            download
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center space-x-3 text-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">assets.csv</span>
              <span className="text-[10px] text-slate-400">Track, signals, TRD assets</span>
            </div>
          </a>

          <a
            href="/api/data/templates/block_windows_template.csv"
            download
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center space-x-3 text-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">block_windows.csv</span>
              <span className="text-[10px] text-slate-400">Available possession slots</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Data
