import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createTask } from '../../services/api'
import {
  AlertTriangle,
  Camera,
  MapPin,
  Train,
  CheckCircle2,
  FileText,
  Upload,
  ArrowLeft,
  Clock,
  ShieldAlert
} from 'lucide-react'

export const InspectorReportIssue: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [department, setDepartment] = useState('TRACK')
  const [defectType, setDefectType] = useState('Fracture / Weld Defect')
  const [severity, setSeverity] = useState<number>(3)
  const [sectionCode, setSectionCode] = useState(user?.section_code || 'C2-02')
  const [trackNumber, setTrackNumber] = useState('Track 2 (Down Line)')
  const [locationName, setLocationName] = useState('KM 142/6 Salem–Erode')
  const [trainBlockRef, setTrainBlockRef] = useState('')
  const [description, setDescription] = useState('')
  const [photoEvidence, setPhotoEvidence] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoEvidence(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setErrorMsg('Please enter a brief operational description of the issue.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const payload = {
        department,
        defect_type: defectType,
        severity,
        location_name: locationName,
        section_code: sectionCode,
        track_number: trackNumber,
        train_block_reference: trainBlockRef || undefined,
        description,
        evidence_data: photoEvidence || undefined,
        reported_by_role: 'INSPECTOR',
        reported_by_user_id: user?.user_id,
        created_at: new Date().toISOString()
      }

      const res = await createTask(payload)
      setSuccessMsg(`Issue logged successfully (${res?.reference_no || 'Submitted'}). Awaiting Operations Manager Review.`)
      setTimeout(() => {
        navigate('/inspector/issues')
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit issue. Please verify network connectivity.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Report Track / Technical Issue</h1>
          <p className="text-xs text-slate-400">Canonical field defect logging • Dispatches directly to Manager review</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 flex items-center space-x-3 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Mobile-first Form (Ordered for fast single-handed field data entry) */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5">
        {/* Auto Context Pill */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Inspector: <strong className="text-white">{user?.full_name || 'Field Inspector'}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* 1. Location & Section */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            1. Location & Section
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold mb-1 block">Kilometer / Landmark</span>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. KM 142/6 Salem–Erode"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold mb-1 block">Track / Line Reference</span>
              <select
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Track 1 (Up Line)">Track 1 (Up Line)</option>
                <option value="Track 2 (Down Line)">Track 2 (Down Line)</option>
                <option value="Track 3 (Loop / Siding)">Track 3 (Loop / Siding)</option>
                <option value="Yard Line / Platform">Yard Line / Platform</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Issue Category & Defect Type */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            2. Issue Category & Defect
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'TRACK', label: 'Civil / Track' },
              { id: 'SIGNAL', label: 'S&T Signal' },
              { id: 'TRACTION', label: '25kV Traction' }
            ].map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setDepartment(cat.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all min-h-[44px] ${
                  department === cat.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-semibold mb-1 block">Defect Title / Category</span>
            <input
              type="text"
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              placeholder="e.g. Rail fracture, Fishplate crack, Point failure"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 3. Severity Rating (1 to 5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Operational Severity
            </label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              severity >= 4 ? 'bg-red-500/20 text-red-400' : severity === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              Level {severity} of 5 {severity >= 4 ? '— Critical / Speed Restriction' : severity === 3 ? '— Moderate / Urgent' : '— Routine'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setSeverity(s)}
                className={`py-2.5 rounded-xl font-black text-sm border transition-all min-h-[44px] ${
                  severity === s
                    ? s >= 4
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : s === 3
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            4. Detailed Description & Symptoms
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            placeholder="Describe physical defect observations, track clearance, ultrasonic test findings, or immediate speed restriction applied..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 5. Photo / Evidence Capture */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            5. Photo Evidence / Inspection Camera
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer transition-all min-h-[44px]">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Capture Photo / Upload File</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
            {photoEvidence ? (
              <div className="flex items-center space-x-2">
                <img
                  src={photoEvidence}
                  alt="Evidence Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700 shadow-xs"
                />
                <span className="text-xs text-emerald-400 font-bold">Image Attached</span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">No image attached (Optional)</span>
            )}
          </div>
        </div>

        {/* Sticky Submit Action (Min 44px touch target) */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98 min-h-[48px] flex items-center justify-center space-x-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>SUBMIT FOR MANAGER REVIEW</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Lifecycle: DRAFT → SUBMITTED → MANAGER REVIEW. You cannot approve your own reported issue.
          </p>
        </div>
      </form>
    </div>
  )
}

export default InspectorReportIssue
