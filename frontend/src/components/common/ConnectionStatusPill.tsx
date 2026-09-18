import React from 'react'
import { useRealtime } from '../../context/RealtimeContext'
import { Wifi, WifiOff } from 'lucide-react'

export const ConnectionStatusPill: React.FC = () => {
  const { isConnected, connectionStatus } = useRealtime()

  let statusConfig = {
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
    label: 'Connected',
    icon: Wifi,
  }

  if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
    statusConfig = {
      bg: 'bg-zinc-800 text-zinc-300 border-zinc-700/80',
      dot: 'bg-amber-400 animate-ping',
      label: connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting',
      icon: Wifi,
    }
  } else if (!isConnected || connectionStatus === 'disconnected') {
    statusConfig = {
      bg: 'bg-zinc-800 text-zinc-400 border-zinc-700/80',
      dot: 'bg-zinc-500',
      label: 'Offline',
      icon: WifiOff,
    }
  }

  const Icon = statusConfig.icon

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${statusConfig.bg} select-none transition-colors`}
      title={`Event Bus: ${statusConfig.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
      <Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} />
      <span>{statusConfig.label}</span>
    </div>
  )
}

export default ConnectionStatusPill
