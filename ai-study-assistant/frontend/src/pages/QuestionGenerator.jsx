import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { HelpCircle, Copy, Download, Save, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

const difficulties = ['Easy', 'Medium', 'Hard']
const counts = [5, 10, 15, 20]
const types = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'short', label: 'Short Answer' },
  { value: 'long', label: 'Long Answer' },
  { value: 'truefalse', label: 'True/False' },
  { value: 'mixed', label: 'Mixed' },
]

export default function QuestionGenerator() {
  const location = useLocation()
  const [materials, setMaterials] = useState([])
  const [materialId, setMaterialId] = useState(location.state?.materialId || '')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(5)
  const [qType, setQType] = useState('mcq')
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/materials').then((res) => setMaterials(res.data))
  }, [])

  const handleGenerate = async () => {
    if (!topic.trim() && !materialId) {
      toast.error('Please enter a topic or select study material first.')
      return
    }
    setLoading(true)
    setQuestions(null)
    try {
      const res = await api.post('/ai/generate-questions', {
        topic: materialId ? undefined : topic,
        material_id: materialId || undefined,
        difficulty: difficulty.toLowerCase(),
        num_questions: count,
        question_type: qType,
      })
      setQuestions(res.data.questions)
    } catch (err) {
      toast.error(getErrorMessage(err, 'AI Assistant is temporarily unavailable. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!questions) return
    try {
      await api.post('/question-sets', { topic: topic || 'Uploaded Material', difficulty, question_type: qType, questions })
      toast.success('Question set saved!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(questions, null, 2))
    toast.success('Copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Question Generator</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate practice questions from a topic or your uploaded material.</p>
      </div>

      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Topic</label>
            <input value={topic} onChange={(e) => { setTopic(e.target.value); if (e.target.value) setMaterialId('') }} placeholder="e.g. Binary Search Trees" className="input-field" />
          </div>
          <div>
            <label className="label-text">Or select study material</label>
            <select value={materialId} onChange={(e) => { setMaterialId(e.target.value); if (e.target.value) setTopic('') }} className="input-field">
              <option value="">— None —</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.filename}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label-text">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium ${difficulty === d ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-text">Number of Questions</label>
            <div className="flex gap-2">
              {counts.map((c) => (
                <button key={c} onClick={() => setCount(c)} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium ${count === c ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-text">Question Type</label>
            <select value={qType} onChange={(e) => setQType(e.target.value)} className="input-field">
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full sm:w-auto">
          <HelpCircle size={16} /> {loading ? 'Generating...' : 'Generate Questions'}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />)}
        </div>
      )}

      {questions && !loading && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Generated Questions ({questions.length})</h2>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn-ghost text-xs"><Copy size={13} /> Copy</button>
              <button onClick={handleDownload} className="btn-ghost text-xs"><Download size={13} /> Download</button>
              <button onClick={handleSave} className="btn-ghost text-xs"><Save size={13} /> Save</button>
            </div>
          </div>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="font-medium text-slate-800 dark:text-white">{i + 1}. {q.question}</p>
                {q.options && (
                  <ul className="mt-2 space-y-1">
                    {q.options.map((opt, j) => (
                      <li key={j} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${opt === q.correct_answer ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {opt === q.correct_answer && <CheckCircle2 size={14} />} {opt}
                      </li>
                    ))}
                  </ul>
                )}
                {!q.options && (q.correct_answer || q.model_answer) && (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    <strong>Answer:</strong> {q.correct_answer || q.model_answer}
                  </p>
                )}
                {q.explanation && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400"><strong>Explanation:</strong> {q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
