import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Flame, Target, Trophy, TrendingUp, Award, AlertTriangle } from 'lucide-react'
import api from '../services/api'

export default function Progress() {
  const [stats, setStats] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [quizScores, setQuizScores] = useState([])
  const [subjects, setSubjects] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, w, q, sub] = await Promise.all([
          api.get('/progress/stats'),
          api.get('/progress/weekly-activity'),
          api.get('/progress/quiz-scores'),
          api.get('/progress/subject-performance'),
        ])
        setStats(s.data)
        setWeekly(w.data)
        setQuizScores(q.data)
        setSubjects(sub.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />)}
      </div>
    )
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Progress Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track your study journey with real data.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <Flame className="mb-2 text-orange-500" size={20} />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.study_streak}</p>
          <p className="text-xs text-slate-500">Day Study Streak</p>
        </div>
        <div className="card p-5">
          <Target className="mb-2 text-brand-600" size={20} />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.average_quiz_score}%</p>
          <p className="text-xs text-slate-500">Average Score</p>
        </div>
        <div className="card p-5">
          <Trophy className="mb-2 text-amber-500" size={20} />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.best_score}%</p>
          <p className="text-xs text-slate-500">Best Score</p>
        </div>
        <div className="card p-5">
          <TrendingUp className="mb-2 text-emerald-600" size={20} />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.quizzes_completed}</p>
          <p className="text-xs text-slate-500">Quizzes Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Weekly Study Activity</h2>
          {weekly.every((d) => d.count === 0) ? (
            <p className="py-10 text-center text-sm text-slate-400">No activity yet this week.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2749e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Quiz Scores Over Time</h2>
          {quizScores.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No quizzes taken yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quizScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Subject Performance</h2>
        {subjects.subjects.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Take a quiz to see subject-wise performance.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjects.subjects} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="topic" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="average" fill="#3c66f5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subjects.strongest_subject && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <Award className="text-emerald-600" size={20} />
                  <div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Strongest Subject</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{subjects.strongest_subject}</p>
                  </div>
                </div>
              )}
              {subjects.needs_more_practice && (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-900/20">
                  <AlertTriangle className="text-amber-600" size={20} />
                  <div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Needs More Practice</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{subjects.needs_more_practice}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
