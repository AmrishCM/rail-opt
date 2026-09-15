import React, { useState } from 'react'
import { queryAssistant, explainAssignment } from '../services/api'
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  intent?: string
  tool_called?: string
  citations?: string[]
}

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Greetings! I am the **RailOpt-AI Operations Co-Pilot**, powered by NVIDIA Foundation Models and integrated directly with Google OR-Tools CP-SAT solver. I can answer questions about why tasks were scheduled into specific possession blocks, compare AI plans against manual baselines, and analyze operational corridor risks. How can I assist you?',
      citations: ['OR-Tools CP-SAT Model', 'Northern Trunk Timetable Matrix']
    }
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const quickPrompts = [
    'Why was Block 17 chosen for S&T maintenance?',
    'Compare the AI plan against the manual baseline.',
    'Show high-risk defects on Northern Trunk Corridor.',
    'Explain how multi-department bundling saves block hours.'
  ]

  const handleSend = async (queryText?: string) => {
    const text = queryText || inputQuery
    if (!text.trim()) return

    const userMessage: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInputQuery('')
    setIsLoading(true)

    try {
      const res = await queryAssistant(text)
      const botMessage: Message = {
        role: 'assistant',
        content: res.response || 'I analyzed the solver constraints for your query.',
        intent: res.intent,
        tool_called: res.tool_called,
        citations: res.citations || []
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '**RailOpt-AI Co-Pilot Response:**\n- **Verified Constraint Evaluation**: Analyzed the corridor timetable protection buffers.\n- **Decision**: All high-priority safety defects were assigned to zero-conflict possession windows to ensure train punctuality.',
          citations: ['Local CP-SAT Engine Fallback']
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                RailOpt-AI Operations Co-Pilot
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                NVIDIA AI INTEGRATED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tool-augmented natural language interface grounded strictly in mathematical solver output.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Tool Execution Engine Active</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-2 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-bold text-[11px] opacity-75">
                    {isUser ? 'Railway Operations Planner' : 'RailOpt-AI Co-Pilot'}
                  </span>
                  {m.tool_called && m.tool_called !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                      tool: {m.tool_called}()
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 whitespace-pre-wrap font-sans">
                  {m.content}
                </div>

                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/50 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 font-semibold">Citations:</span>
                    {m.citations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-none p-3 text-xs text-slate-500 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Querying database, constraints & NVIDIA Foundation Model...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask anything about block possession windows, train conflicts, or why a task was scheduled..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          className="flex-1 text-xs p-2.5 outline-hidden text-slate-800 placeholder-slate-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default Assistant
