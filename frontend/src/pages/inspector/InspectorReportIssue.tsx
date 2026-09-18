import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createTask } from '../../services/api'
import {
  AlertTriangle,
  Camera,
  MapPin,
  CheckCircle2,
  Upload,
  ArrowLeft,
  X,
  Layers,
  FileText,
  Sparkles
} from 'lucide-react'

const DEPARTMENT_PRESETS: Record<string, { label: string; system: string; suggestions: { issue: string; location: string; desc: string }[] }> = {
  'Engineering/Track': {
    label: 'Track Management System (TMS)',
    system: 'TMS',
    suggestions: [
      {
        issue: 'Rail Fracture — Transverse Crack at Weld Joint',
        location: 'Section C2-02 Salem–Erode (KM 142/6 Down Line)',
        desc: 'Ultrasonic flaw detector detected 18mm vertical transverse crack on gauge face. Requires immediate emergency fish-plating and 90-minute block possession.'
      },
      {
        issue: 'Ballast Washout under Sleeper Bed',
        location: 'Section C2-01 Jolarpettai (KM 139/4 Up Line)',
        desc: 'Monsoon scouring eroded ballast cushion over 12m length. 30 km/h caution order required.'
      },
      {
        issue: 'CMS Crossing Nose Chipping',
        location: 'Section C2-03 Erode Junction (KM 156/2 Crossover 14B)',
        desc: 'Cast Manganese Steel crossing nose chipped 4mm over 35mm length. Heavy dynamic impact.'
      }
    ]
  },
  'S&T/Signalling': {
    label: 'Signalling Maintenance System (SMMS)',
    system: 'SMMS',
    suggestions: [
      {
        issue: 'Dual Axle Counter Head Malfunction',
        location: 'Section C2-02 Salem Yard Approach (KM 144/2 Track Circuit 4T)',
        desc: 'Intermittent track vacancy drop under high temperature. Reset pulse failure observed on CBI rack.'
      },
      {
        issue: 'Point Machine High Throw Resistance',
        location: 'Section C2-02 Section Crossover 12A (KM 143/8)',
        desc: 'Motor operating current exceeded 4.5A threshold. Obstruction in facing point lock.'
      }
    ]
  },
  'Traction Distribution': {
    label: 'Traction Distribution System (TDMS)',
    system: 'TDMS',
    suggestions: [
      {
        issue: '25kV Cantilever Insulator Flashover',
        location: 'Section C2-02 Salem Sub-Sector (KM 142/8 Portal Mast 42/12)',
        desc: 'Heavy industrial soot accumulation causing intermittent leakage current and micro-arcing. Power block required.'
      },
      {
        issue: 'Catenary Contact Wire Local Wear',
        location: 'Section C2-01 Salem Incline (KM 138/5 Span 24)',
        desc: 'Contact wire thickness reduced to 7.8mm (limit 8.0mm). Dropper wire tension imbalance.'
      }
    ]
  }
}

export const InspectorReportIssue: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Exactly 5 operational fields
  const [department, setDepartment] = useState('Engineering/Track')
  const [issue, setIssue] = useState('')
  const [location, setLocation] = useState('Section C2-02 Salem–Erode (KM 142/6)')
  const [photo, setPhoto] = useState<string | null>(null)
  const [description, setDescription] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const applySuggestion = (sug: { issue: string; location: string; desc: string }) => {
    setIssue(sug.issue)
    setLocation(sug.location)
    setDescription(sug.desc)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue.trim()) {
      setErrorMsg('Please specify the issue / defect title.')
      return
    }
    if (!location.trim()) {
      setErrorMsg('Please specify the exact track or asset location.')
      return
    }
    if (!description.trim()) {
      setErrorMsg('Please enter an operational defect description.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        department,
        issue,
        description,
        location,
        location_name: location,
        photo_evidence: photo || undefined,
        photo: photo || undefined,
        task_type: 'CORRECTIVE',
        severity: 8,
        safety_impact: 8,
        estimated_duration: 90,
        required_block_type: 'TRAFFIC_BLOCK',
        reported_by_role: 'INSPECTOR',
        reported_by_user_id: user?.user_id
      }

      const res = await createTask(payload)
      const refNo = res?.reference_no || res?.data?.reference_no || 'RO-2026-Pending'
      setSuccessMsg(`Issue logged successfully (${refNo}). AI Planning Engine has generated an optimized schedule and dispatched to Manager Review.`)
      setTimeout(() => {
        navigate('/inspector/issues')
      }, 1600)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit issue. Please check network connectivity.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPresets = DEPARTMENT_PRESETS[department]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Report Railway Issue
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                5-Field Form
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logs directly to AI Maintenance Planning Engine • Propagates to Manager Review
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-start space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Accepted</p>
            <p className="text-xs text-emerald-200/90 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 flex items-start space-x-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Error</p>
            <p className="text-xs text-rose-200/90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FIELD 1: Department */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-400" />
            1. Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
          >
            <option value="Engineering/Track">Track Management System (TMS) — Civil & Permanent Way</option>
            <option value="S&T/Signalling">Signalling Maintenance System (SMMS) — S&T & Interlocking</option>
            <option value="Traction Distribution">Traction Distribution System (TDMS) — 25kV OHE & Substations</option>
          </select>
        </div>

        {/* Quick defect presets from TMS/SMMS/TDMS */}
        {currentPresets && (
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick-Fill from {currentPresets.system} Telemetry:
              </span>
              <span className="text-[11px] text-slate-500">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentPresets.suggestions.map((sug, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => applySuggestion(sug)}
                  className="text-left text-xs bg-slate-800/70 hover:bg-blue-900/30 hover:border-blue-500/50 border border-slate-700/60 px-2.5 py-1.5 rounded-lg text-slate-300 transition-colors"
                >
                  {sug.issue.split('—')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FIELD 2: Issue */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            2. Issue / Defect
          </label>
          <input
            type="text"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="e.g. Rail Fracture Transverse Crack at Weld Joint"
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
          />
        </div>

        {/* FIELD 3: Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            3. Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Section C2-02 Salem–Erode (KM 142/6 Down Line)"
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
          />
        </div>

        {/* FIELD 4: Photo */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-purple-400" />
            4. Photo Evidence
          </label>

          {photo ? (
            <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-2 overflow-hidden flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={photo}
                  alt="Defect Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white">Defect Photograph Captured</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">JPEG evidence attached to RO issue dossier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center transition-colors mr-2"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-5 bg-slate-900/40 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <Upload className="w-7 h-7 text-slate-500 group-hover:text-blue-400 transition-colors mb-1.5" />
              <span className="text-xs font-medium text-slate-300">
                Click to attach inspection photograph or drop file
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* FIELD 5: Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            5. Operational Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the technical defect, required safety precautions, rail temperature, or speed restrictions..."
            className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/inspector/issues')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting & Triggering AI...</span>
              </>
            ) : (
              <span>Submit Issue & Trigger AI</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InspectorReportIssue
