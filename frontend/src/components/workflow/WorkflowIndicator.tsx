import React from 'react'
import {
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  UserCheck,
  CheckCircle,
  Wrench,
  Activity,
  RotateCcw
} from 'lucide-react'

export interface WorkflowIndicatorProps {
  currentStep: number // 1 to 9
  onStepClick?: (step: number) => void
}

export const WORKFLOW_STEPS = [
  { id: 1, title: 'Work Reported', shortTitle: '1. Report', icon: FileText, desc: 'Maintenance work entered' },
  { id: 2, title: 'AI Checks Urgency', shortTitle: '2. Urgency', icon: AlertTriangle, desc: 'AI calculates priority score' },
  { id: 3, title: 'Blocks Identified', shortTitle: '3. Windows', icon: Clock, desc: 'Available slots checked against traffic' },
  { id: 4, title: 'AI Recommends Plan', shortTitle: '4. AI Plan', icon: Sparkles, desc: 'Multi-crew coordinated schedule' },
  { id: 5, title: 'Engineer Reviews', shortTitle: '5. Review', icon: UserCheck, desc: 'Engineer validates task assignments' },
  { id: 6, title: 'Manager Approves', shortTitle: '6. Approval', icon: CheckCircle, desc: 'Manager grants corridor possession' },
  { id: 7, title: 'Teams Execute', shortTitle: '7. Execute', icon: Wrench, desc: 'Field teams start and record work' },
  { id: 8, title: 'System Monitors', shortTitle: '8. Monitor', icon: Activity, desc: 'Real-time completion & KPIs' },
  { id: 9, title: 'AI Re-Plans', shortTitle: '9. Re-Plan', icon: RotateCcw, desc: 'Emergency defect automatic re-plan' }
]

export const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Railway Operational Workflow
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Current Stage: <span className="text-white font-bold">{WORKFLOW_STEPS[currentStep - 1]?.title}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Step {currentStep} of 9
          </span>
        </div>

        {/* 9-Step Stepper Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 pt-1">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon
            const isCurrent = currentStep === step.id
            const isCompleted = currentStep > step.id
            const isPending = currentStep < step.id

            return (
              <button
                key={step.id}
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-left transition-all border ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/20 ring-1 ring-blue-400'
                    : isCompleted
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800/40 hover:bg-slate-800/60 text-slate-400 border-slate-700/50'
                }`}
                title={`${step.title}: ${step.desc}`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white text-blue-700'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-900'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className="truncate min-w-0">
                  <div className="text-[11px] font-bold truncate leading-tight">
                    {step.shortTitle.split(' ')[1]}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
