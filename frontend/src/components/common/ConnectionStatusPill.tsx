import React from 'react'
import { useRealtime } from '../../context/RealtimeContext'
import { Wifi, WifiOff } from 'lucide-react'

export const ConnectionStatusPill: React.FC = () => {
  const { isConnected, connectionStatus } = useRealtime()

  let statusConfig = {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500 animate-pulse',
    label: 'Connected',
    icon: Wifi,
  }

  if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
    statusConfig = {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dot: 'bg-amber-500 animate-ping',
      label: connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting',
      icon: Wifi,
    }
  } else if (!isConnected || connectionStatus === 'disconnected') {
    statusConfig = {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      dot: 'bg-rose-500',
      label: 'Offline',
      icon: WifiOff,
    }
  }

  const Icon = statusConfig.icon

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.bg} select-none transition-colors`}
      title={`Railway Operations Event Bus: ${statusConfig.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
      <Icon className="w-3 h-3 shrink-0" />
      <span className="hidden sm:inline">{statusConfig.label}</span>
    </div>
  )
}
