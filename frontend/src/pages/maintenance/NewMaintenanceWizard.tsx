import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createTask, fetchAssets, fetchTaskPriority } from '../../services/api'
import {
  FileText,
  MapPin,
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Train
} from 'lucide-react'

export const NewMaintenanceWizard: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1)
  const [assets, setAssets] = useState<any[]>([])

  // Form State
  const [problemTitle, setProblemTitle] = useState('Rail crack detected')
  const [problemDescription, setProblemDescription] = useState('Ultrasonic testing detected 18mm transverse fissure near weld joint on Up Fast line')
  const [severity, setSeverity] = useState<number>(10)
  const [selectedAssetId, setSelectedAssetId] = useState<number>(1)
  const [department, setDepartment] = useState('Engineering/Track')
  const [requiredWork, setRequiredWork] = useState('Cut defective rail section, insert 6m rail piece, and execute thermit weld')
  const [estimatedHours, setEstimatedHours] = useState<number>(2)
  const [preferredDate, setPreferredDate] = useState('15 Sep 2026')
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('14:00 – 16:30')

  // Result state after submission
  const [submittedTask, setSubmittedTask] = useState<any | null>(null)
  const [priorityAnalysis, setPriorityAnalysis] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    fetchAssets().then((res) => {
      setAssets(res?.items || res || [])
    }).catch(console.error)
  }, [])

  const selectedAsset = assets.find((a) => a.asset_id === selectedAssetId)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        asset_id: selectedAssetId,
        department,
        task_type: severity >= 8 ? 'CORRECTIVE' : 'PREVENTIVE',
        defect_type: problemTitle,
        description: problemDescription,
        severity,
        safety_impact: severity >= 8 ? 10 : 6,
        estimated_duration: estimatedHours * 60,
        required_block_type: 'TRAFFIC_BLOCK',
        overdue_days: 3
      }

      const created = await createTask(payload)
      setSubmittedTask(created)

      // Fetch plain language priority explanation
      const prio = await fetchTaskPriority(created.task_id)
      setPriorityAnalysis(prio)
      setStep(5) // Move to confirmation & AI priority view
    } catch (err) {
      console.error('Failed to create maintenance task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Report Maintenance Work</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              STEP 1 OF RAILWAY WORKFLOW
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log track, signalling, or traction defects for automated AI urgency evaluation and coordinated block planning.
          </p>
        </div>
        <Link to="/maintenance" className="text-xs font-bold text-slate-500 hover:text-slate-800">
          Cancel
        </Link>
      </div>

      {/* 5-Step Progress Bar (Section 19) */}
      <div className="grid grid-cols-5 gap-2 text-xs">
        {[
          { num: 1, label: '1. Problem' },
          { num: 2, label: '2. Location & Asset' },
          { num: 3, label: '3. Required Work' },
          { num: 4, label: '4. Review' },
          { num: 5, label: '5. AI Priority' }
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              step === s.num
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                : step > s.num
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: Problem */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Step 1: Identify Defect or Problem
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Problem Title</label>
              <input
                type="text"
                value={problemTitle}
                onChange={(e) => setProblemTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="e.g. Rail crack detected, Point motor contact failure"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
              <textarea
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="Describe observations, flaw size, and conditions"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value={10}>Critical (Immediate Safety Hazard - 10/10)</option>
                  <option value={8}>High (Mainline Operational Risk - 8/10)</option>
                  <option value={6}>Medium (Preventive Maintenance Due - 6/10)</option>
                  <option value={4}>Low (Routine Inspection - 4/10)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Engineering/Track">Engineering / Track</option>
                  <option value="S&T/Signalling">S&T / Signalling</option>
                  <option value="Traction Distribution">Traction Distribution (25kV OHE)</option>
                  <option value="Telecommunication">Telecommunication</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
            >
              <span>Continue to Location</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Location & Asset */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Step 2: Select Railway Location & Asset
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Railway Corridor</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                Corridor C2 — Western Feeder (Ahmedabad - Vadodara)
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Track Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {assets.map((a) => (
                  <option key={a.asset_id} value={a.asset_id}>
                    {a.location} ({a.department})
                  </option>
                ))}
              </select>
            </div>

            {selectedAsset && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs space-y-1">
                <div className="font-bold text-blue-900">Asset Details:</div>
                <div className="text-blue-800">Type: {selectedAsset.asset_type} • Criticality: {selectedAsset.criticality}/100</div>
                <div className="text-blue-700">Location: {selectedAsset.location}</div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
            >
              <span>Continue to Required Work</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Required Work & Timing */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Step 3: Required Work & Timing
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Required Maintenance Work</label>
              <input
                type="text"
                value={requiredWork}
                onChange={(e) => setRequiredWork(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration</label>
                <select
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value={1}>1 Hour (60 mins)</option>
                  <option value={2}>2 Hours (120 mins) — Recommended for rail replacement</option>
                  <option value={3}>3 Hours (180 mins)</option>
                  <option value={4}>4 Hours (240 mins)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="text"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time Window</label>
              <input
                type="text"
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
            >
              <span>Review Before Submission</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review Summary */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Step 4: Review Maintenance Request
          </h2>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Location:</span>
              <span className="font-extrabold text-slate-900">Corridor C2 / Section C2-02 (KM 42.8)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Asset:</span>
              <span className="font-extrabold text-slate-900">{selectedAsset?.location || 'Track T-104'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Department:</span>
              <span className="font-extrabold text-blue-700">{department}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Problem:</span>
              <span className="font-extrabold text-slate-900">{problemTitle}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Severity:</span>
              <span className="font-extrabold text-red-600 uppercase">Critical (10/10)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Required Work:</span>
              <span className="font-extrabold text-slate-900">{requiredWork}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold">Estimated Work:</span>
              <span className="font-extrabold text-slate-900">{estimatedHours} hours</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm"
            >
              {isSubmitting ? (
                <span>Submitting to Railway Engine...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SAVE MAINTENANCE REQUEST</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AI Prioritization Results (Section 4) */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-black text-emerald-950">Maintenance Request Submitted</h2>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Reference ID: <strong className="font-mono text-emerald-950">{submittedTask?.reference_no || 'MR-2026-00124'}</strong>
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-emerald-600 text-white rounded-lg">
              RECORD SAVED
            </span>
          </div>

          {/* AI Prioritization Card (Section 4) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 2 Analysis</span>
                <h3 className="text-base font-black text-slate-900 uppercase">MAINTENANCE PRIORITY</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-red-600">
                  {priorityAnalysis?.score || 92} / 100
                </span>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">
                  {priorityAnalysis?.level || 'Critical'}
                </span>
              </div>
            </div>

            {/* Visual Priority Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${priorityAnalysis?.score || 92}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Routine (0)</span>
                <span>Medium (50)</span>
                <span>Critical (100)</span>
              </div>
            </div>

            {/* Plain Language "Why?" Reasons (No ML Formulas) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase">Why this score?</h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(priorityAnalysis?.reasons || [
                  'Safety impact is high',
                  'Asset is operationally important',
                  'Maintenance is overdue by 3 days',
                  'Delay may affect mainline passenger train operations'
                ]).map((reason: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Action */}
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900">
              <strong>Recommended Action:</strong>{' '}
              {priorityAnalysis?.recommended_action || 'Schedule at the earliest suitable block.'}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link to="/maintenance" className="text-xs font-bold text-slate-600 hover:underline">
                ← Back to Backlog
              </Link>
              <Link
                to="/planner"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm"
              >
                <span>Proceed to Step 3: Available Windows</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default NewMaintenanceWizard
