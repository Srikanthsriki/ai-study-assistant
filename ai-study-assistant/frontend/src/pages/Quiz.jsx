import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckCircle2, XCircle, Clock, Trophy, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'

const difficulties = ['Easy', 'Medium', 'Hard']
const counts = [5, 10, 15, 20]

function performanceMessage(pct) {
  if (pct >= 90) return 'Excellent! 🎉'
  if (pct >= 70) return 'Good job! 👏'
  if (pct >= 50) return 'Not bad — keep practicing!'
  return 'Keep practicing! You\'ll improve. 💪'
}

export default function Quiz() {
  const [stage, setStage] = useState('setup') // setup | taking | result
  const [materials, setMaterials] = useState([])
  const [materialId, setMaterialId] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)

  const [quizId, setQuizId] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [startTime, setStartTime] = useState(null)
  const [result, setResult] = useState(null)
  const [review, setReview] = useState(null)

  useEffect(() => {
    api.get('/materials').then((res) => setMaterials(res.data))
  }, [])

  const startQuiz = async () => {
    if (!topic.trim() && !materialId) {
      toast.error('Please enter a topic or select study material first.')
      return
    }
    setLoading(true)
    try {
      const genRes = await api.post('/ai/generate-quiz', {
        topic: materialId ? undefined : topic,
        material_id: materialId || undefined,
        difficulty: difficulty.toLowerCase(),
        num_questions: count,
      })
      const createRes = await api.post('/quiz/start', {
        topic: genRes.data.topic,
        difficulty,
        questions: genRes.data.questions,
      })
      const qRes = await api.get(`/quiz/${createRes.data.id}/questions`)
      setQuizId(createRes.data.id)
      setQuestions(qRes.data)
      setAnswers({})
      setCurrentIndex(0)
      setStartTime(Date.now())
      setStage('taking')
    } catch (err) {
      toast.error(getErrorMessage(err, 'AI Assistant is temporarily unavailable. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (questionId, option) => {
    setAnswers((a) => ({ ...a, [questionId]: option }))
  }

  const finishQuiz = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    const payload = {
      quiz_id: quizId,
      time_taken_seconds: timeTaken,
      answers: questions.map((q) => ({ question_id: q.id, user_answer: answers[q.id] || null })),
    }
    try {
      const res = await api.post('/quiz/submit', payload)
      setResult(res.data)
      const reviewRes = await api.get(`/quiz/${quizId}/review`)
      setReview(reviewRes.data)
      setStage('result')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const resetQuiz = () => {
    setStage('setup')
    setQuizId(null)
    setQuestions([])
    setAnswers({})
    setResult(null)
    setReview(null)
  }

  // ---------------- Setup ----------------
  if (stage === 'setup') {
    return (
      <div className="animate-fadeIn space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Mode</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Test your knowledge with an interactive AI-generated quiz.</p>
        </div>

        <div className="card mx-auto max-w-xl space-y-4 p-6">
          <div>
            <label className="label-text">Topic</label>
            <input value={topic} onChange={(e) => { setTopic(e.target.value); if (e.target.value) setMaterialId('') }} placeholder="e.g. Normalization in DBMS" className="input-field" />
          </div>
          <div>
            <label className="label-text">Or select study material</label>
            <select value={materialId} onChange={(e) => { setMaterialId(e.target.value); if (e.target.value) setTopic('') }} className="input-field">
              <option value="">— None —</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.filename}</option>)}
            </select>
          </div>
          <div>
            <label className="label-text">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${difficulty === d ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-text">Number of Questions</label>
            <div className="flex gap-2">
              {counts.map((c) => (
                <button key={c} onClick={() => setCount(c)} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${count === c ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startQuiz} disabled={loading} className="btn-primary w-full py-2.5">
            <ClipboardCheck size={16} /> {loading ? 'Preparing quiz...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    )
  }

  // ---------------- Taking ----------------
  if (stage === 'taking') {
    const q = questions[currentIndex]
    const options = q.options ? JSON.parse(q.options) : []
    const isLast = currentIndex === questions.length - 1

    return (
      <div className="animate-fadeIn mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Question {currentIndex + 1} of {questions.length}</span>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{q.question}</h2>
          <div className="mt-5 space-y-2.5">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectAnswer(q.id, opt)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  answers[q.id] === opt
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary"
          >
            Previous
          </button>
          {isLast ? (
            <button onClick={finishQuiz} className="btn-primary">Finish Quiz</button>
          ) : (
            <button onClick={() => setCurrentIndex((i) => i + 1)} className="btn-primary">Next Question</button>
          )}
        </div>
      </div>
    )
  }

  // ---------------- Result ----------------
  if (stage === 'result' && result && review) {
    const unanswered = review.questions.filter((q) => !q.user_answer).length
    return (
      <div className="animate-fadeIn mx-auto max-w-3xl space-y-6">
        <div className="card p-8 text-center">
          <Trophy size={40} className="mx-auto mb-3 text-amber-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{result.percentage}%</h1>
          <p className="mt-1 text-lg font-medium text-brand-600">{performanceMessage(result.percentage)}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{result.score}/{result.total_questions}</p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{result.score}</p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{result.total_questions - result.score - unanswered}</p>
              <p className="text-xs text-slate-500">Wrong</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-400">{unanswered}</p>
              <p className="text-xs text-slate-500">Unanswered</p>
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1 text-sm text-slate-500">
            <Clock size={14} /> Time taken: {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
          </p>
          <button onClick={resetQuiz} className="btn-primary mt-6"><RotateCcw size={15} /> Take Another Quiz</button>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Review</h2>
          <div className="space-y-4">
            {review.questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-start gap-2">
                  {q.is_correct ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />}
                  <p className="font-medium text-slate-800 dark:text-white">{i + 1}. {q.question}</p>
                </div>
                <div className="mt-2 ml-6 space-y-1 text-sm">
                  <p className="text-slate-500">Your answer: <span className={q.is_correct ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>{q.user_answer || 'Not answered'}</span></p>
                  {!q.is_correct && <p className="text-slate-500">Correct answer: <span className="font-medium text-emerald-600">{q.correct_answer}</span></p>}
                  {q.explanation && <p className="text-xs text-slate-400 mt-1">{q.explanation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
