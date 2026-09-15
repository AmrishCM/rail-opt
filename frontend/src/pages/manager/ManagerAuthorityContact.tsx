import React, { useState, useEffect } from 'react'
import { fetchAuthorities, escalateAuthority } from '../../services/api'
import {
  PhoneCall,
  Mail,
  MessageSquare,
  AlertTriangle,
  Radio,
  ShieldCheck,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react'

export const ManagerAuthorityContact: React.FC = () => {
  const [authorities, setAuthorities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<{
    contact: any
    channel: 'CALL' | 'EMAIL' | 'MESSAGE' | 'ESCALATE'
  } | null>(null)
  const [message, setMessage] = useState('')
  const [issueRef, setIssueRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadAuthorities = async () => {
    setLoading(true)
    try {
      const data = await fetchAuthorities()
      setAuthorities(data || [])
    } catch (err) {
      console.error('Failed to load authorities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthorities()
  }, [])

  const handleActionConfirm = async () => {
    if (!activeModal) return
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await escalateAuthority({
        contact_id: activeModal.contact.id,
        issue_reference: issueRef || undefined,
        channel: activeModal.channel,
        message: message || `Operational communication dispatched via ${activeModal.channel}.`
      })
      setSuccessMsg(res?.message || `Dispatched ${activeModal.channel} to ${activeModal.contact.authority_name}.`)
      setActiveModal(null)
      setMessage('')
      setIssueRef('')
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to dispatch communication.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            <span>Official Railway Divisional Communications Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Railway Authority Contact</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real, configured divisional contacts for Control Board, Section Controllers, Station Masters, and Safety Directorate
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>VHF Radio & Digital Lines Active</span>
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
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Authority Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading configured authorities...</div>
      ) : authorities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
          No configured railway authorities found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {authorities.map((auth) => (
            <div
              key={auth.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {auth.role_type}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    auth.priority_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {auth.priority_level}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white leading-snug">
                  {auth.authority_name}
                </h3>
                <p className="text-xs text-slate-400">{auth.designation}</p>

                <div className="pt-2 space-y-1 text-xs font-mono text-slate-300 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <a href={`tel:${auth.phone}`} className="text-emerald-400 hover:underline">
                      {auth.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email:</span>
                    <a href={`mailto:${auth.email}`} className="text-blue-400 hover:underline truncate max-w-[170px]">
                      {auth.email}
                    </a>
                  </div>
                  {auth.radio_channel && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Radio:</span>
                      <span className="text-amber-300">{auth.radio_channel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Action Buttons (Call, Email, Message, Escalate) */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setActiveModal({ contact: auth, channel: 'CALL' })}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex flex-col items-center justify-center space-y-1 min-h-[44px]"
                  title="Initiate Call"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => setActiveModal({ contact: auth, channel: 'EMAIL' })}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex flex-col items-center justify-center space-y-1 min-h-[44px]"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Email</span>
                </button>
                <button
                  onClick={() => setActiveModal({ contact: auth, channel: 'MESSAGE' })}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex flex-col items-center justify-center space-y-1 min-h-[44px]"
                  title="Send Direct Message"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Message</span>
                </button>
                <button
                  onClick={() => setActiveModal({ contact: auth, channel: 'ESCALATE' })}
                  className="py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-bold flex flex-col items-center justify-center space-y-1 min-h-[44px]"
                  title="Urgent Escalation"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Escalate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action / Dispatch Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  Dispatch Action: {activeModal.channel}
                </span>
                <h3 className="text-sm font-black text-white mt-0.5">
                  {activeModal.contact.authority_name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Issue / Block Reference (Optional)</label>
                <input
                  type="text"
                  value={issueRef}
                  onChange={(e) => setIssueRef(e.target.value)}
                  placeholder="e.g. ISSUE-1024 or BLOCK-04"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Message / Logged Operational Notes *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={`Enter details for ${activeModal.channel.toLowerCase()} dispatch...`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs min-h-[44px] flex items-center justify-center space-x-1"
              >
                {submitting ? 'Recording...' : `Confirm ${activeModal.channel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerAuthorityContact
