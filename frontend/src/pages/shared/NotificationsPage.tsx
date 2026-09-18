import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCheck,
  Filter,
  RefreshCw,
  Info,
  Radio,
  RotateCcw
} from 'lucide-react'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useRealtime } from '../../context/RealtimeContext'

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth()
  const { lastEvent } = useRealtime()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL')

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await fetchNotifications()
      setNotifications(Array.isArray(data) ? data : data?.items || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Auto-reload on incoming domain event
  useEffect(() => {
    if (lastEvent) {
      loadNotifications()
    }
  }, [lastEvent])

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read
    if (filter === 'URGENT') return n.notification_type === 'CRITICAL' || n.notification_type === 'WARNING'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Operational Notifications
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-filtered domain events • Work orders • Replan requests • Timetable adjustments
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center space-x-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filter === 'UNREAD'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('URGENT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
            filter === 'URGENT'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          Critical / Urgent
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">All caught up</p>
          <p className="text-xs text-slate-500">No operational alerts matching this filter.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const isCritical =
              n.notification_type === 'CRITICAL' ||
              n.title?.toLowerCase().includes('critical') ||
              n.title?.toLowerCase().includes('replan')
            const isWorkOrder =
              n.event_type?.includes('WORK') || n.title?.toLowerCase().includes('work order')

            return (
              <div
                key={n.notification_id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  !n.is_read
                    ? 'bg-slate-900/90 border-blue-500/50 shadow-sm shadow-blue-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isWorkOrder
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCritical ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isWorkOrder ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1 font-mono">
                      <span>{n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}</span>
                      {n.event_type && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                          {n.event_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {n.link && (
                    <Link
                      to={n.link}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center space-x-1 transition-colors"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.notification_id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
