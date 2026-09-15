import React, { useEffect, useState } from 'react'
import { fetchTasks, createTask, fetchAssets } from '../services/api'
import { CriticalityBreakdownModal } from '../components/tasks/CriticalityBreakdownModal'
import {
  Wrench,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Gauge
} from 'lucide-react'

export const Maintenance: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // New task form state
  const [newDesc, setNewDesc] = useState('')
  const [newDept, setNewDept] = useState('Engineering/Track')
  const [newAssetId, setNewAssetId] = useState(1)
  const [newSeverity, setNewSeverity] = useState(8)
  const [newSafety, setNewSafety] = useState(8)
  const [newDuration, setNewDuration] = useState(90)

  useEffect(() => {
    loadTasks()
  }, [selectedDept, selectedSeverity])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await fetchTasks({
        department: selectedDept || undefined,
        severity_min: selectedSeverity ? Number(selectedSeverity) : undefined,
        page_size: 100
      })
      setTasks(res?.items || [])
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBreakdown = (task: any) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTask({
        asset_id: newAssetId,
        department: newDept,
        description: newDesc,
        severity: newSeverity,
        safety_impact: newSafety,
        estimated_duration: newDuration,
        required_block_type: 'TRAFFIC_BLOCK'
      })
      setCreateModalOpen(false)
      setNewDesc('')
      loadTasks()
    } catch (err) {
      console.error('Failed to create task:', err)
    }
  }

  const filteredTasks = tasks.filter((t) =>
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.defect_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.asset_location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Maintenance Defect Backlog
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {tasks.length} DEFECTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized asset defects with ML-assisted failure prediction and explainable criticality scores.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Defect</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search defects by description, location, or component..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-hidden"
          >
            <option value="">All Departments</option>
            <option value="Engineering/Track">Engineering/Track</option>
            <option value="S&T/Signalling">S&T/Signalling</option>
            <option value="Traction Distribution">Traction Distribution</option>
            <option value="Telecommunication">Telecommunication</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-700 outline-hidden"
          >
            <option value="">All Severities</option>
            <option value="8">Severity &ge; 8 (High)</option>
            <option value="6">Severity &ge; 6 (Medium)</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Defect Description</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Safety Impact</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-center">Criticality Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((t) => {
                const score = t.priority_score || 50
                const isCritical = score >= 80 || t.safety_impact >= 8
                return (
                  <tr key={t.task_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      T-{t.task_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {t.department}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="font-semibold text-slate-900 block truncate">{t.description}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Type: {t.defect_type || 'Defect'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium truncate max-w-xs">
                      {t.asset_location || 'Corridor C1'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        t.safety_impact >= 8
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : (t.safety_impact >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200')
                      }`}>
                        {t.safety_impact}/10
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {t.estimated_duration} min
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenBreakdown(t)}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all inline-flex items-center space-x-1 ${
                          score >= 80
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : (score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100')
                        }`}
                      >
                        <span>{score}/100</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenBreakdown(t)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Criticality Breakdown Modal */}
      <CriticalityBreakdownModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        task={selectedTask}
      />

      {/* Report Defect Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Report Railway Asset Defect</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Defect Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultrasonic rail flaw detected on section..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-hidden"
                  >
                    <option value="Engineering/Track">Engineering/Track</option>
                    <option value="S&T/Signalling">S&T/Signalling</option>
                    <option value="Traction Distribution">Traction Distribution</option>
                    <option value="Telecommunication">Telecommunication</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asset ID</label>
                  <input
                    type="number"
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Safety (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSafety}
                    onChange={(e) => setNewSafety(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save & Prioritize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Maintenance
