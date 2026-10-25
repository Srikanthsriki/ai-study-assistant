import { useState } from 'react'
import { Sun, Moon, Bell, ShieldAlert, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const aiPreferences = [
  { value: 'concise', label: 'Concise', desc: 'Short, to-the-point answers' },
  { value: 'balanced', label: 'Balanced', desc: 'Clear explanations with examples' },
  { value: 'detailed', label: 'Detailed', desc: 'In-depth, step-by-step answers' },
]

export default function Settings() {
  const { user, logout, refreshUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [aiPref, setAiPref] = useState(user?.ai_response_preference || 'balanced')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const saveAiPref = async (value) => {
    setAiPref(value)
    try {
      await api.put('/profile/settings', { ai_response_preference: value })
      await refreshUser()
      toast.success('AI response preference updated.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm.')
      return
    }
    setDeleting(true)
    try {
      await api.delete('/profile/account')
      toast.success('Account deleted.')
      logout()
      window.location.href = '/'
    } catch (err) {
      toast.error(getErrorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your app preferences and account.</p>
      </div>

      {/* Theme */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Theme</p>
            <p className="text-xs text-slate-500">Switch between light and dark mode.</p>
          </div>
          <button onClick={toggleTheme} className="btn-secondary">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* AI Preference */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">AI Response Preference</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {aiPreferences.map((p) => (
            <button
              key={p.value}
              onClick={() => saveAiPref(p.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                aiPref === p.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Bell size={16} /> Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Study reminders</p>
            <p className="text-xs text-slate-500">Get notified about your study streak and quiz results.</p>
          </div>
          <button
            onClick={() => setNotifEnabled((n) => !n)}
            className={`h-6 w-11 rounded-full transition-colors ${notifEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <span className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform ${notifEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card border-red-100 p-6 dark:border-red-900/40">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-red-600"><ShieldAlert size={16} /> Danger Zone</h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Delete Account</p>
            <p className="text-xs text-slate-500">Permanently delete your account and all associated data.</p>
          </div>
          <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">Are you absolutely sure?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently delete your account, chats, notes, materials, and quiz history. This action cannot be undone.
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Type <strong>DELETE</strong> to confirm:</p>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="input-field mt-2" placeholder="DELETE" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setConfirmOpen(false); setConfirmText('') }} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
