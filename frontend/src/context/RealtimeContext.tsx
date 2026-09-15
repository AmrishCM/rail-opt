import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'

export interface OnlineUser {
  user_id: number
  employee_id?: string
  full_name: string
  role: string
  department?: string
  online_since?: string
}

export interface DomainEventPacket {
  type: string
  event_type?: string
  aggregate_type?: string
  aggregate_id?: string
  payload?: any
  title?: string
  message?: string
  created_at?: string
  timestamp?: string
}

interface RealtimeContextType {
  isConnected: boolean
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
  onlineUsers: OnlineUser[]
  lastEvent: DomainEventPacket | null
  toast: { title: string; message: string; type?: string } | null
  clearToast: () => void
  reconnect: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>('disconnected')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [lastEvent, setLastEvent] = useState<DomainEventPacket | null>(null)
  const [toast, setToast] = useState<{ title: string; message: string; type?: string } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const pingTimerRef = useRef<any>(null)
  const reconnectTimerRef = useRef<any>(null)
  const pollTimerRef = useRef<any>(null)
  const backoffRef = useRef<number>(1000)

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  // Invalidate queries across the application when operational domain events occur
  const handleDomainEvent = useCallback((event: DomainEventPacket) => {
    setLastEvent(event)

    const eventType = event.event_type || event.type

    // Show toast for actionable updates
    if (event.title || event.message) {
      setToast({
        title: event.title || `Live Update: ${eventType}`,
        message: event.message || 'System operational state changed.',
        type: eventType.includes('CRITICAL') ? 'critical' : 'info'
      })
    }

    // Invalidate relevant query caches
    switch (eventType) {
      case 'ISSUE_CREATED':
      case 'ISSUE_UPDATED':
      case 'ISSUE_ACKNOWLEDGED':
      case 'ISSUE_APPROVED':
      case 'ISSUE_REJECTED':
      case 'ISSUE_CLOSED':
      case 'WORK_ASSIGNED':
      case 'WORK_STARTED':
      case 'WORK_RESOLVED':
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['maintenance'] })
        queryClient.invalidateQueries({ queryKey: ['todayWork'] })
        queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        break

      case 'PLAN_CREATED':
      case 'PLAN_UPDATED':
      case 'REPLAN_COMPLETED':
      case 'PLAN_REVISED':
        queryClient.invalidateQueries({ queryKey: ['plans'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        break

      case 'PLAN_APPROVED':
      case 'TIMETABLE_UPDATED':
        queryClient.invalidateQueries({ queryKey: ['plans'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['todayWork'] })
        queryClient.invalidateQueries({ queryKey: ['timeline'] })
        queryClient.invalidateQueries({ queryKey: ['corridor'] })
        queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        break

      case 'TASK_STARTED':
      case 'TASK_PAUSED':
      case 'TASK_COMPLETED':
      case 'TASK_BLOCKED':
      case 'ENGINEER_BLOCKED_TASK':
        queryClient.invalidateQueries({ queryKey: ['todayWork'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['plans'] })
        queryClient.invalidateQueries({ queryKey: ['timeline'] })
        queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        break

      case 'CRITICAL_EVENT_CREATED':
        queryClient.invalidateQueries({ queryKey: ['criticalEvents'] })
        queryClient.invalidateQueries({ queryKey: ['plans'] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['todayWork'] })
        queryClient.invalidateQueries({ queryKey: ['diagnostics'] })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        break

      default:
        queryClient.invalidateQueries()
        break
    }
  }, [queryClient])

  // Periodic fetch of online users
  const refreshOnlineUsers = useCallback(async () => {
    try {
      const resp = await fetch('/api/system/online-users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (resp.ok) {
        const data = await resp.json()
        setOnlineUsers(data.online_users || [])
      }
    } catch {
      // Ignore network errors in polling
    }
  }, [token])

  // Establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
      setConnectionStatus('disconnected')
      return
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    setConnectionStatus('connecting')

    // Determine WS URL (proxied via Vite on 5180 -> 8100, or direct if needed)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/events?token=${encodeURIComponent(token)}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        backoffRef.current = 1000 // Reset backoff

        // Clear fallback polling
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }

        // Start ping heartbeat every 25 seconds
        if (pingTimerRef.current) clearInterval(pingTimerRef.current)
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 25000)

        // Query online users
        refreshOnlineUsers()

        // Also invalidate current queries on reconnect to catch up
        queryClient.invalidateQueries()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'pong' || data.type === 'connection_established') {
            return
          }
          if (data.type === 'user_presence') {
            refreshOnlineUsers()
            return
          }
          handleDomainEvent(data)
        } catch {
          // ignore non-json messages
        }
      }

      ws.onerror = () => {
        // Handled in onclose
      }

      ws.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('reconnecting')
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current)
          pingTimerRef.current = null
        }

        // Fallback polling while disconnected (Section 11)
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            queryClient.invalidateQueries({ queryKey: ['todayWork'] })
          }, 8000)
        }

        // Exponential backoff reconnect
        const delay = Math.min(backoffRef.current * 1.5, 10000)
        backoffRef.current = delay
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket()
        }, delay)
      }
    } catch {
      setIsConnected(false)
      setConnectionStatus('reconnecting')
    }
  }, [isAuthenticated, token, handleDomainEvent, refreshOnlineUsers, queryClient])

  useEffect(() => {
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [connectWebSocket])

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    backoffRef.current = 1000
    connectWebSocket()
  }, [connectWebSocket])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        connectionStatus,
        onlineUsers,
        lastEvent,
        toast,
        clearToast,
        reconnect
      }}
    >
      {children}
      {/* Toast popup for live domain events */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-slate-900 text-white rounded-lg shadow-2xl p-4 border border-slate-700 animate-slide-up flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${toast.type === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`}></span>
              <h4 className="text-sm font-semibold tracking-wide text-white">{toast.title}</h4>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={clearToast}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>
      )}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = (): RealtimeContextType => {
  const ctx = useContext(RealtimeContext)
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return ctx
}
