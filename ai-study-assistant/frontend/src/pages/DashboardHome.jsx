import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, UploadCloud, Sparkles, HelpCircle, ClipboardCheck,
  BookOpen, Target, FolderOpen, TrendingUp, Clock,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const quickActions = [
  { to: '/assistant', icon: MessageSquare, label: 'Ask AI' },
  { to: '/materials', icon: UploadCloud, label: 'Upload Material' },
  { to: '/summarizer', icon: Sparkles, label: 'Summarize Notes' },
  { to: '/questions', icon: HelpCircle, label: 'Generate Questions' },
  { to: '/quiz', icon: ClipboardCheck, label: 'Start Quiz' },
]

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon size={19} />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const activityLabels = {
  chat: 'Chatted with AI Assistant',
  summarize: 'Generated a summary',
  generate_questions: 'Generated practice questions',
  quiz: 'Completed a quiz',
  upload_material: 'Uploaded study material',
  note_create: 'Created a study note',
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, actRes, matRes, quizRes] = await Promise.all([
          api.get('/progress/stats'),
          api.get('/progress/recent-activity'),
          api.get('/materials'),
          api.get('/quiz'),
        ])
        setStats(statsRes.data)
        setActivity(actRes.data)
        setMaterials(matRes.data.slice(0, 4))
        setQuizzes(quizRes.data.slice(0, 4))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Here's a snapshot of your study progress.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Study Sessions" value={loading ? '—' : stats?.study_sessions ?? 0} accent="bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400" />
        <StatCard icon={ClipboardCheck} label="Quizzes Completed" value={loading ? '—' : stats?.quizzes_completed ?? 0} accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={Target} label="Avg Quiz Score" value={loading ? '—' : `${stats?.average_quiz_score ?? 0}%`} accent="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard icon={FolderOpen} label="Materials Uploaded" value={loading ? '—' : stats?.materials_uploaded ?? 0} accent="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <StatCard icon={MessageSquare} label="Questions Asked" value={loading ? '—' : stats?.questions_asked ?? 0} accent="bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" />
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-brand-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <a.icon size={18} />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Clock size={17} /> Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet. Start by asking the AI something!</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{activityLabels[a.type] || a.type}</span>
                  <span className="text-xs text-slate-400">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent materials */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <FolderOpen size={17} /> Recent Study Materials
          </h2>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-400">No study materials yet.<br />Upload your first PDF to start learning.</p>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-600 dark:text-slate-300">{m.filename}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs uppercase text-slate-500 dark:bg-slate-800">{m.file_type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quiz performance */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <TrendingUp size={17} /> Quiz Performance
          </h2>
          {quizzes.length === 0 ? (
            <p className="text-sm text-slate-400">No quizzes taken yet.</p>
          ) : (
            <ul className="space-y-3">
              {quizzes.map((q) => (
                <li key={q.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-600 dark:text-slate-300">{q.topic}</span>
                  <span className={`font-semibold ${q.percentage >= 70 ? 'text-emerald-600' : q.percentage >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {q.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
