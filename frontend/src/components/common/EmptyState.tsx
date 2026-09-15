import React from 'react'
import { Link } from 'react-router-dom'
import { LucideIcon, Inbox } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  actionText?: string
  actionTo?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  actionTo,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-slate-200/90 rounded-2xl shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4 ring-8 ring-slate-50">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionText && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          {actionText}
        </Link>
      )}
      {actionText && !actionTo && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}
