import React, { useState } from 'react'
import { askAssistant } from '../services/api'
import { Bot, Send, Sparkles, Cpu, Clock, CheckCircle2, ChevronRight } from 'lucide-react'

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your RailOpt-AI Operations Co-Pilot. I can answer questions regarding corridor maintenance schedules, train conflict resolutions, and why specific block allocations were chosen by the constraint solver. How can I assist your operational decisions today?',
      tool_called: 'system_init',
      citations: ['OR-Tools Engine', 'Corridor C2 Timetable']
    }
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const quickPrompts = [
    'Why is Track C2 block scheduled from 14:00 to 16:30?',
    'What train movements conflict with emergency rail replacement?',
    'Show me the multi-crew coordination savings on Corridor C2.',
    'What are the priority scores for today’s open defects?'
  ]

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery
    if (!textToSend.trim()) return

    const newMessages = [
      ...messages,
      { role: 'user', content: textToSend }
    ]
    setMessages(newMessages)
    setInputQuery('')
    setIsLoading(true)

    try {
      const response = await askAssistant(textToSend)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: response.answer || response.response,
          tool_called: response.tool_called,
          citations: response.citations || ['OR-Tools Engine']
        }
      ])
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I encountered an operational retrieval error querying the live solver. Please ensure the backend services are reachable.',
          tool_called: 'error'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
                RailOpt-AI Operations Co-Pilot
              </h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                AI Integrated
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tool-augmented natural language interface grounded strictly in mathematical solver output
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Active</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 min-h-[420px] max-h-[550px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user'
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-lg p-4 space-y-2 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-zinc-950/60 border border-zinc-800 text-zinc-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-mono text-[10px] uppercase opacity-75">
                    {isUser ? 'Railway Operations Planner' : 'RailOpt-AI Co-Pilot'}
                  </span>
                  {m.tool_called && m.tool_called !== 'none' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      tool: {m.tool_called}()
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 whitespace-pre-wrap">
                  {m.content}
                </div>

                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-500 font-mono">Citations:</span>
                    {m.citations.map((c: string, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono"
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
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg rounded-bl-none p-3 text-xs text-zinc-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400 animate-spin" strokeWidth={1.5} />
              <span>Querying database, constraints &amp; optimization models...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask anything about block possession windows, train conflicts, or why a task was scheduled..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          className="flex-1 text-xs px-3 py-2 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-hidden"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || isLoading}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export default Assistant
