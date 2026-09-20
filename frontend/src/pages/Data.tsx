import React, { useState, useEffect } from 'react'
import {
  reseedDatabase,
  fetchConnectorsStatus,
  triggerUnifiedSync,
  fetchHarmonizedDefects,
  fetchSpatialClusters
} from '../services/api'
import {
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Cpu,
  ArrowRight,
  Database,
  Radio,
  Server,
  Zap,
  MapPin,
  ShieldAlert
} from 'lucide-react'

export const Data: React.FC = () => {
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<any | null>(null)

  // Ingestion & Connectors state
  const [connectorsLoading, setConnectorsLoading] = useState(false)
  const [connectors, setConnectors] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncData, setSyncData] = useState<any | null>(null)
  const [harmonizedDefects, setHarmonizedDefects] = useState<any[]>([])
  const [spatialClusters, setSpatialClusters] = useState<any[]>([])

  const loadConnectors = async () => {
    setConnectorsLoading(true)
    try {
      const res = await fetchConnectorsStatus()
      setConnectors(res.connectors || [])
      const defects = await fetchHarmonizedDefects(2)
      setHarmonizedDefects(defects || [])
      const clusters = await fetchSpatialClusters(2)
      setSpatialClusters(clusters.all_clusters || [])
    } catch (err) {
      console.error('Failed to load connector status:', err)
    } finally {
      setConnectorsLoading(false)
    }
  }

  useEffect(() => {
    loadConnectors()
  }, [])

  const handleUnifiedSync = async () => {
    setSyncing(true)
    try {
      const res = await triggerUnifiedSync(2)
      setSyncData(res.data)
      setHarmonizedDefects(res.data.harmonized_defects || [])
      setSpatialClusters(res.data.spatial_clusters || [])
    } catch (err) {
      console.error('Failed unified sync:', err)
    } finally {
      setSyncing(false)
    }
  }

  const handleReseed = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await reseedDatabase(7)
      setSeedResult(res)
      loadConnectors()
    } catch (err) {
      console.error('Failed to seed:', err)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-500" />
            <span>Unified Data Ingestion & Spatial Harmonization Pipeline</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automated REST API connectors to <strong>TMS, SMMS, TDMS, COA, and BDMS</strong> with linear referencing standardization.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleUnifiedSync}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Harmonizing Pipeline...' : 'Sync All 5 Connectors'}</span>
          </button>

          <button
            onClick={handleReseed}
            disabled={seeding}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>{seeding ? 'Seeding...' : 'Reset Demo Seeds'}</span>
          </button>
        </div>
      </div>

      {syncData && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">
              Synchronized {syncData.total_ingested} records across TMS, SMMS, TDMS, and BDMS. Detected {syncData.shadow_opportunities_detected} multi-department shadowing opportunities.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
            Linear Referencing: 100% Harmonized
          </span>
        </div>
      )}

      {/* 5 Enterprise REST API Connectors Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Automated Department REST API Connectors (Simulated IR Feeds)</span>
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">5/5 Connected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {connectors.map((c) => (
            <div
              key={c.code}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-200">{c.code}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ● {c.status}
                  </span>
                </div>
                <h3 className="text-[11px] font-medium text-zinc-300 mt-1 line-clamp-1" title={c.name}>
                  {c.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">{c.department}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[10px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-zinc-200">{c.latency_ms} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Records:</span>
                  <span className="text-blue-400 font-bold">{c.records_available}</span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="text-zinc-400 truncate max-w-[110px]" title={c.protocol}>{c.protocol}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spatial Clusters & Shadowing Opportunities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Detected Cross-Department Spatial Clusters (Shadowing Engine)</span>
          </h2>
          <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
            {spatialClusters.filter(c => c.is_multi_department).length} Multi-Department Combinations
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {spatialClusters.filter(c => c.is_multi_department).slice(0, 4).map((clust) => (
            <div
              key={clust.cluster_id}
              className="bg-zinc-900 border border-purple-500/30 bg-gradient-to-br from-zinc-900 via-purple-950/10 to-zinc-900 rounded-xl p-4 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {clust.cluster_id}
                  </span>
                  <span className="text-xs font-bold font-mono text-zinc-200">{clust.chainage_str}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Saves ~{Math.max(30, clust.total_separate_duration - clust.recommended_joint_block_duration)}m downtime
                </span>
              </div>

              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <span className="text-[10px] text-zinc-400 font-mono">Clubbed Departments:</span>
                {clust.departments.map((d: string) => (
                  <span key={d} className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800 text-zinc-400">
                <div>Separate Possessions: <span className="text-zinc-200 font-bold">{clust.total_separate_duration}m</span></div>
                <div>Recommended Joint Block: <span className="text-purple-300 font-bold">{clust.recommended_joint_block_duration}m</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standardized Linear Referencing Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Standardized Linear Referencing Master Table</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Harmonized across <strong>Section, Line ID, Km/Chainage, Track ID</strong>.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded border border-zinc-700">
            {harmonizedDefects.length} Harmonized Defects
          </span>
        </div>

        <div className="overflow-x-auto border border-zinc-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3">Defect ID</th>
                <th className="p-3">Department</th>
                <th className="p-3">Section</th>
                <th className="p-3">Track ID</th>
                <th className="p-3">Chainage (Km)</th>
                <th className="p-3">Defect Description</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
              {harmonizedDefects.slice(0, 10).map((d) => (
                <tr key={d.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-3 font-bold text-blue-400">{d.id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-200">
                      {d.department}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-300">{d.section_code}</td>
                  <td className="p-3 text-purple-400 font-bold">{d.track_id}</td>
                  <td className="p-3 font-bold text-amber-300">{d.chainage_str}</td>
                  <td className="p-3 text-zinc-300 max-w-xs truncate" title={d.defect_type}>{d.defect_type}</td>
                  <td className="p-3 text-zinc-400">{d.estimated_duration}m</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                      d.severity >= 8 ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                      d.severity >= 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {d.severity}/10
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Data
