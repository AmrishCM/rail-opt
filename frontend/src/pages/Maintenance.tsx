import React, { useEffect, useState } from 'react'
import { fetchTasks, createTask } from '../services/api'
import { CriticalityBreakdownModal } from '../components/tasks/CriticalityBreakdownModal'
import {
  Search,
  Plus,
  ChevronRight,
  X
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Maintenance Defect Backlog
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {tasks.length} DEFECTS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Prioritized asset defects with ML-assisted failure prediction and explainable criticality scores.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report new defect</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search defects by description, location, or component..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded border border-zinc-700 bg-zinc-950 text-zinc-200 placeholder-zinc-600 font-mono outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-mono p-2 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 outline-none focus:border-blue-500"
          >
            <option value="" className="bg-zinc-900">All Departments</option>
            <option value="Engineering/Track" className="bg-zinc-900">Engineering/Track</option>
            <option value="S&T/Signalling" className="bg-zinc-900">S&T/Signalling</option>
            <option value="Traction Distribution" className="bg-zinc-900">Traction Distribution</option>
            <option value="Telecommunication" className="bg-zinc-900">Telecommunication</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs font-mono p-2 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 outline-none focus:border-blue-500"
          >
            <option value="" className="bg-zinc-900">All Severities</option>
            <option value="8" className="bg-zinc-900">Severity ≥ 8 (High)</option>
            <option value="6" className="bg-zinc-900">Severity ≥ 6 (Medium)</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
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
            <tbody className="divide-y divide-zinc-800">
              {filteredTasks.map((t) => {
                const score = t.priority_score || 50
                return (
                  <tr key={t.task_id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-zinc-200">T-{t.task_id}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{t.department}</td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <span className="text-zinc-200 block truncate">{t.description}</span>
                      <span className="text-[10px] text-zinc-600">Type: {t.defect_type || 'Defect'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 truncate max-w-xs">{t.asset_location || 'Corridor C1'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        t.safety_impact >= 8
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : t.safety_impact >= 5
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {t.safety_impact}/10
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">{t.estimated_duration} min</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenBreakdown(t)}
                        className={`px-3 py-1 rounded text-xs font-mono border transition-colors inline-flex items-center space-x-1 ${
                          score >= 80
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            : score >= 60
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        <span>{score}/100</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenBreakdown(t)}
                        className="text-xs font-mono text-blue-400 hover:underline"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-zinc-100">Report Railway Asset Defect</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-zinc-400 block mb-1">Defect Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultrasonic rail flaw detected on section..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500 placeholder-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Engineering/Track" className="bg-zinc-900">Engineering/Track</option>
                    <option value="S&T/Signalling" className="bg-zinc-900">S&T/Signalling</option>
                    <option value="Traction Distribution" className="bg-zinc-900">Traction Distribution</option>
                    <option value="Telecommunication" className="bg-zinc-900">Telecommunication</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Asset ID</label>
                  <input
                    type="number"
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(Number(e.target.value))}
                    className="w-full p-2.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Severity (1-10)</label>
                  <input type="number" min="1" max="10" value={newSeverity} onChange={(e) => setNewSeverity(Number(e.target.value))}
                    className="w-full p-2 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Safety (1-10)</label>
                  <input type="number" min="1" max="10" value={newSafety} onChange={(e) => setNewSafety(Number(e.target.value))}
                    className="w-full p-2 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Duration (min)</label>
                  <input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full p-2 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 text-xs outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
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
