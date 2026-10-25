import { useEffect, useRef, useState } from 'react'
import {
  Plus, Send, Trash2, Pencil, Copy, X, Menu, Bot, User as UserIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

const quickPrompts = [
  'Explain this topic',
  'Give an example',
  'Summarize this',
  'Create exam questions',
  "Explain like I'm a beginner",
  'Give me a quiz',
]

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <Bot size={16} />
        </div>
      )}
      <div className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
        isUser
          ? 'bg-brand-600 text-white rounded-br-sm'
          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-bl-sm'
      }`}>
        {content}
        {!isUser && (
          <button
            onClick={() => { navigator.clipboard.writeText(content); toast.success('Copied!') }}
            className="absolute -bottom-3 right-1 hidden rounded-md bg-white p-1 text-slate-400 shadow group-hover:block dark:bg-slate-900"
            title="Copy response"
          >
            <Copy size={12} />
          </button>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <UserIcon size={16} />
        </div>
      )}
    </div>
  )
}

export default function Assistant() {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef(null)

  const loadSessions = async () => {
    const res = await api.get('/ai/chat/sessions')
    setSessions(res.data)
    return res.data
  }

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openSession = async (id) => {
    setActiveSessionId(id)
    setSidebarOpen(false)
    const res = await api.get(`/ai/chat/sessions/${id}/messages`)
    setMessages(res.data)
  }

  const startNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setSidebarOpen(false)
  }

  const sendMessage = async (text) => {
    const messageText = (text ?? input).trim()
    if (!messageText || sending) return

    setInput('')
    setMessages((m) => [...m, { id: `temp-${Date.now()}`, role: 'user', content: messageText, created_at: new Date().toISOString() }])
    setSending(true)

    try {
      const res = await api.post('/ai/chat', { session_id: activeSessionId, message: messageText })
      setMessages((m) => [...m, { id: res.data.message_id, role: 'assistant', content: res.data.reply, created_at: new Date().toISOString() }])
      if (!activeSessionId) {
        setActiveSessionId(res.data.session_id)
      }
      await loadSessions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'AI Assistant is temporarily unavailable. Please try again.'))
      setMessages((m) => m.slice(0, -1)) // remove the optimistic user message on failure
    } finally {
      setSending(false)
    }
  }

  const renameSession = async (id, currentTitle) => {
    const title = window.prompt('Rename chat', currentTitle)
    if (!title || !title.trim()) return
    await api.post(`/ai/chat/sessions/${id}/rename`, { title: title.trim() })
    await loadSessions()
  }

  const deleteSession = async (id) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return
    await api.delete(`/ai/chat/sessions/${id}`)
    if (activeSessionId === id) startNewChat()
    await loadSessions()
    toast.success('Chat deleted.')
  }

  const clearChat = () => {
    if (!activeSessionId) {
      setMessages([])
      return
    }
    deleteSession(activeSessionId)
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4 animate-fadeIn">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-20 bg-black/40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`fixed z-30 flex h-[calc(100vh-4rem)] w-72 flex-col rounded-2xl border border-slate-100 bg-white p-3 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:h-full lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <button onClick={startNewChat} className="btn-primary mb-3 w-full">
          <Plus size={16} /> New Chat
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {sessions.length === 0 && <p className="p-3 text-sm text-slate-400">No chats yet. Start a new conversation!</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer ${
                activeSessionId === s.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              onClick={() => openSession(s.id)}
            >
              <span className="truncate">{s.title}</span>
              <div className="hidden shrink-0 gap-1 group-hover:flex">
                <button onClick={(e) => { e.stopPropagation(); renameSession(s.id, s.title) }} className="text-slate-400 hover:text-brand-600"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id) }} className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <h2 className="font-semibold text-slate-900 dark:text-white">AI Study Assistant</h2>
          </div>
          <button onClick={clearChat} className="btn-ghost text-xs"><X size={14} /> Clear chat</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <Bot size={26} />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">How can I help you study today?</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Ask about programming, math, data science, exam prep, or anything academic.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} role={m.role} content={m.content} />
          ))}
          {sending && (
            <div className="flex items-center gap-2 pl-11 text-slate-400">
              <span className="h-2 w-2 animate-pulseDot rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-pulseDot rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-pulseDot rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
          {quickPrompts.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex items-end gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            rows={1}
            placeholder="Ask your study question..."
            className="input-field flex-1 resize-none"
          />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary h-10 w-10 p-0 shrink-0">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
