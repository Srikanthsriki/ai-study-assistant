import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, Copy, Download, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

const lengthOptions = [
  { value: 'short', label: 'Short Summary' },
  { value: 'medium', label: 'Medium Summary' },
  { value: 'detailed', label: 'Detailed Summary' },
  { value: 'bullet', label: 'Bullet-Point Notes' },
  { value: 'exam', label: 'Exam Revision Notes' },
]

export default function Summarizer() {
  const location = useLocation()
  const [text, setText] = useState('')
  const [materials, setMaterials] = useState([])
  const [materialId, setMaterialId] = useState(location.state?.materialId || '')
  const [length, setLength] = useState('medium')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/materials').then((res) => setMaterials(res.data))
  }, [])

  const handleGenerate = async () => {
    if (!text.trim() && !materialId) {
      toast.error('Please enter some study material first.')
      return
    }
    setLoading(true)
    setSummary('')
    try {
      const res = await api.post('/ai/summarize', {
        text: materialId ? undefined : text,
        material_id: materialId || undefined,
        length,
      })
      setSummary(res.data.summary)
    } catch (err) {
      toast.error(getErrorMessage(err, 'AI Assistant is temporarily unavailable. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!summary) return
    try {
      await api.post('/notes', {
        title: `Summary — ${new Date().toLocaleDateString()}`,
        subject: 'Summaries',
        content: summary,
      })
      toast.success('Saved to My Notes!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDownload = () => {
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Summarizer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Turn long notes into clear, structured summaries.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input side */}
        <div className="card space-y-4 p-5">
          <div>
            <label className="label-text">Select Study Material (optional)</label>
            <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="input-field">
              <option value="">— Paste text instead —</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.filename}</option>)}
            </select>
          </div>

          {!materialId && (
            <div>
              <label className="label-text">Paste your text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                placeholder="Paste your notes or chapter text here..."
                className="input-field resize-none"
              />
            </div>
          )}

          <div>
            <label className="label-text">Summary Type</label>
            <div className="grid grid-cols-2 gap-2">
              {lengthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLength(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    length === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            <Sparkles size={16} /> {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>

        {/* Output side */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Result</h2>
            {summary && (
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copied!') }} className="btn-ghost text-xs"><Copy size={13} /> Copy</button>
                <button onClick={handleDownload} className="btn-ghost text-xs"><Download size={13} /> Download</button>
                <button onClick={handleSaveNote} className="btn-ghost text-xs"><Save size={13} /> Save to Notes</button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${90 - i * 5}%` }} />)}
            </div>
          ) : summary ? (
            <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{summary}</div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Your generated summary will appear here.</p>
          )}
        </div>
      </div>
    </div>
  )
}
