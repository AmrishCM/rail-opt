import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createTask } from '../../services/api'
import {
  Wrench,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react'

export const EngineerReportIssue: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [department, setDepartment] = useState(user?.department || 'TRACK')
  const [defectType, setDefectType] = useState('Track Geometry / Alignment')
  const [severity, setSeverity] = useState<number>(3)
  const [sectionCode, setSectionCode] = useState(user?.section_code || 'C2-02')
  const [trackNumber, setTrackNumber] = useState('Track 2 (Down Line)')
  const [locationName, setLocationName] = useState('KM 142/6 Salem–Erode')
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
      setErrorMsg('Please enter a description of the defect.')
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
        description,
        evidence_data: photoEvidence || undefined,
        reported_by_role: 'ENGINEER',
        reported_by_user_id: user?.user_id,
        created_at: new Date().toISOString()
      }

      const res = await createTask(payload)
      setSuccessMsg(`Defect report logged (${res?.reference_no || 'Submitted'}). Sent to Operations Manager.`)
      setTimeout(() => {
        navigate('/engineer/dashboard')
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit issue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Log Technical Maintenance Issue</h1>
          <p className="text-xs text-slate-400">Canonical issue database • Reported by Maintenance Engineer</p>
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

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs flex justify-between items-center">
          <span className="text-slate-300">Engineer: <strong className="text-white">{user?.full_name}</strong></span>
          <span className="text-amber-400 font-mono font-bold">Role: ENGINEER</span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">1. Location & Track</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. KM 142/6 Salem–Erode"
              required
              className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
            <select
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              <option value="Track 1 (Up Line)">Track 1 (Up Line)</option>
              <option value="Track 2 (Down Line)">Track 2 (Down Line)</option>
              <option value="Track 3 (Loop / Siding)">Track 3 (Loop / Siding)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">2. Defect Title</label>
          <input
            type="text"
            value={defectType}
            onChange={(e) => setDefectType(e.target.value)}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">3. Severity (1 - 5)</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                type="button"
                key={s}
                onClick={() => setSeverity(s)}
                className={`py-2.5 rounded-xl font-black text-sm border transition-all min-h-[44px] ${
                  severity === s
                    ? s >= 4 ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">4. Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            placeholder="Technical details of observed defect..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">5. Photo Evidence</label>
          <label className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer min-h-[44px]">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Upload Photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoCapture} className="hidden" />
          </label>
          {photoEvidence && <span className="text-emerald-400 text-xs font-bold ml-2">Photo attached</span>}
        </div>

        <div className="pt-2 border-t border-zinc-800">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-6 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-sm min-h-[44px]"
          >
            {submitting ? 'Submitting...' : 'Submit Issue Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EngineerReportIssue

