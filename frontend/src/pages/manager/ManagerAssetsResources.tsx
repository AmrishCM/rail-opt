import React, { useState, useEffect } from 'react'
import {
  Wrench,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Truck,
  Users,
  Shield,
  Zap,
  Radio
} from 'lucide-react'
import api from '../../services/api'

interface ResourceItem {
  resource_id: string
  name: string
  category: string
  department: string
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RESERVED' | 'UNAVAILABLE'
  home_depot: string
  specs?: string
  assigned_to?: string
}

export const ManagerAssetsResources: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const loadResources = async () => {
    try {
      setLoading(true)
      const res = await api.get('/mock-data/resources')
      setResources(res.data?.resources || [])
    } catch (err) {
      console.error('Failed to load resources:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const filtered = resources.filter((r) => {
    const matchesDept = deptFilter === 'ALL' || r.department === deptFilter || r.category === deptFilter
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchesSearch =
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.resource_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.home_depot?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesDept && matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'IN_USE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'RESERVED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'MAINTENANCE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Engineering Teams':
        return <Users className="w-4 h-4 text-blue-400" />
      case 'Maintenance Vehicles':
        return <Truck className="w-4 h-4 text-amber-400" />
      case 'OHE Equipment':
        return <Zap className="w-4 h-4 text-yellow-400" />
      case 'Signalling Equipment':
        return <Radio className="w-4 h-4 text-emerald-400" />
      default:
        return <Wrench className="w-4 h-4 text-cyan-400" />
    }
  }

  const totalAvailable = resources.filter((r) => r.status === 'AVAILABLE').length
  const totalInUse = resources.filter((r) => r.status === 'IN_USE').length
  const totalMaint = resources.filter((r) => r.status === 'MAINTENANCE').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Railway Assets & Engineering Resources
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-department machinery, gang crews, tower cars, and specialized calibration tools
            </p>
          </div>
        </div>

        <button
          onClick={loadResources}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Inventory
          </span>
          <p className="text-xl font-black text-white">{resources.length}</p>
        </div>
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Available / Ready
          </span>
          <p className="text-xl font-black text-emerald-300">{totalAvailable}</p>
        </div>
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Active in Possession
          </span>
          <p className="text-xl font-black text-blue-300">{totalInUse}</p>
        </div>
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            Workshop Overhaul
          </span>
          <p className="text-xl font-black text-amber-300">{totalMaint}</p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resource name, ID, or depot..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Track Equipment">Track Machinery</option>
            <option value="Signalling Equipment">Signalling Instruments</option>
            <option value="OHE Equipment">Traction / OHE</option>
            <option value="Maintenance Vehicles">Fleet Vehicles</option>
            <option value="Engineering Teams">Crew / Gangs</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="RESERVED">Reserved</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Querying deterministic engineering resource inventory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-2">
          <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No resources matched</p>
          <p className="text-xs text-slate-500">Adjust the category or status filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.resource_id}
              className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">
                      {item.resource_id}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getStatusBadge(
                    item.status
                  )}`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-300 font-medium">{item.department}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Base Depot:</span>
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {item.home_depot}
                  </span>
                </div>
                {item.specs && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Capacity / Specs:</span>
                    <span className="text-slate-300 font-mono text-[10px]">{item.specs}</span>
                  </div>
                )}
                {item.assigned_to && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-slate-800">
                    <span className="text-slate-500">Current Assignment:</span>
                    <span className="text-blue-300 font-bold font-mono text-[10px]">
                      {item.assigned_to}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagerAssetsResources
