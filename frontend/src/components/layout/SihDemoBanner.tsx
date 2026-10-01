import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertOctagon,
  RotateCcw,
  Check
} from 'lucide-react'

export interface SihDemoBannerProps {
  currentStep: number
  onStepChange: (step: number) => void
  onTriggerEmergency: () => void
}

export const DEMO_STORY_STEPS = [
  {
    step: 1,
    role: 'engineer@railopt.demo',
    roleLabel: 'Engineer Ravi',
    title: '1. Report Defect & AI Plan',
    actionText: 'Switch to Engineer',
    targetRoute: '/planner',
    desc: 'Review critical rail crack on C2-02, generate CP-SAT coordinated plan, aligned with data.gov.in OGD network.'
  },
  {
    step: 2,
    role: 'manager@railopt.demo',
    roleLabel: 'Manager Rajesh',
    title: '2. Approve Plan [API Setu]',
    actionText: 'Switch to Manager',
    targetRoute: '/planner',
    desc: 'Review multi-department combination, verify operator competency via API Setu, and authorize corridor possession.'
  },
  {
    step: 3,
    role: 'inspector@railopt.demo',
    roleLabel: 'Inspector Manoj',
    title: '3. Field PWA [Bhashini]',
    actionText: 'Switch to Inspector',
    targetRoute: '/inspector/report-issue',
    desc: 'Dictate defect with Bhashini voice ASR in Hindi/Tamil, verify safety checklist via TTS readout, and log issue.'
  },
  {
    step: 4,
    role: 'manager@railopt.demo',
    roleLabel: 'Manager Rajesh',
    title: '4. Emergency Re-Plan',
    actionText: 'Report Defect & Re-Plan',
    targetRoute: '/',
    desc: 'Signal S-104 fails at 14:20. Trigger automatic dynamic replanner and compare before/after.'
  }
]

export const SihDemoBanner: React.FC<SihDemoBannerProps> = ({
  currentStep,
  onStepChange,
  onTriggerEmergency
}) => {
  const { user, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleExecuteDemoStep = async (stepItem: typeof DEMO_STORY_STEPS[0]) => {
    onStepChange(stepItem.step)

    if (stepItem.step === 4) {
      // Switch to manager and open emergency modal
      await switchRole('manager@railopt.demo')
      onTriggerEmergency()
      return
    }

    if (user?.email !== stepItem.role) {
      await switchRole(stepItem.role)
    }

    navigate(stepItem.targetRoute)
  }

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 py-2.5 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black tracking-wide uppercase text-amber-300">
                SIH 2026 Interactive Demonstration Stepper
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.2 rounded-full text-slate-200">
                Story 1 to 4
              </span>
              <span className="hidden lg:inline-flex items-center space-x-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                <span>DPI: Bhashini &bull; API Setu &bull; data.gov.in OGD</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Click any stage below to automatically switch personas and execute the complete railway workflow.
            </p>
          </div>
        </div>

        {/* 4 Demo Steps */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {DEMO_STORY_STEPS.map((s) => {
            const isCurrent = currentStep === s.step
            return (
              <button
                key={s.step}
                onClick={() => handleExecuteDemoStep(s)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                }`}
              >
                <span>{s.title}</span>
                <ArrowRight className="w-3 h-3 opacity-80" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
