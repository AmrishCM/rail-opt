import React, { useState } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Building2,
  Calendar,
  Hash
} from 'lucide-react'

interface ApiSetuVerificationBadgeProps {
  operatorName?: string
  licenseNumber?: string
  certificateId?: string
  machineryType?: string
  competencyClass?: string
  issueDate?: string
  validUntil?: string
  medicalFitness?: string
  compact?: boolean
}

export const ApiSetuVerificationBadge: React.FC<ApiSetuVerificationBadgeProps> = ({
  operatorName = 'Ravi Sharma',
  licenseNumber = 'DL-0420180098421',
  certificateId = 'RB-TTM-2026-CERT-8841',
  machineryType = 'Track Tamping Machine (TTM / Unimat 08-32)',
  competencyClass = 'Class-A Heavy Track Machine Specialist',
  issueDate = '2018-04-12',
  validUntil = '2029-04-11',
  medicalFitness = 'A-1 Passed (Periodical Medical Examination valid till Nov 2027)',
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 p-3.5 shadow-sm space-y-2.5">
      {/* Primary Badge Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/10">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-xs font-black text-emerald-300">
                Verified via API Setu
              </span>
              <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/15 px-2 py-0.2 rounded-full border border-emerald-500/30">
                MoRTH &bull; Railway Board
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">
              Ministry of Road Transport &amp; Highways / Railway Board Register
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>{expanded ? 'Hide Credential' : 'View DL & Competency'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Operator Identity Preview */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Operator: <strong className="text-white font-semibold">{operatorName}</strong>
          </span>
          <span className="text-slate-500">&bull;</span>
          <span className="font-mono text-emerald-400">{licenseNumber}</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Cert: <span className="text-slate-200">{certificateId}</span>
        </div>
      </div>

      {/* Expanded Credential Dossier */}
      {expanded && (
        <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 animate-fadeIn">
          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Machinery Competency</span>
            <div className="font-semibold text-white">{machineryType}</div>
            <div className="text-[11px] text-amber-300/90">{competencyClass}</div>
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Medical Fitness &amp; PME</span>
            <div className="font-semibold text-emerald-400">{medicalFitness}</div>
            <div className="text-[11px] text-slate-400">Valid Until: <span className="font-mono text-white">{validUntil}</span></div>
          </div>

          <div className="sm:col-span-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center space-x-1.5 truncate">
              <Hash className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Auth Seal: SETU-SHA256-RB9012-MORTH-VERIFIED</span>
            </div>
            <span className="text-emerald-400 font-bold shrink-0 ml-2">Digital Signature Valid</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiSetuVerificationBadge
