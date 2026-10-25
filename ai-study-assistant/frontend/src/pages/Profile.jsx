import { useState, useEffect } from 'react'
import { Save, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({ name: '', course: '', college: '', study_interests: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [stats, setStats] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        course: user.course || '',
        college: user.college || '',
        study_interests: user.study_interests || '',
      })
    }
    api.get('/progress/stats').then((res) => setStats(res.data))
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/profile', form)
      await refreshUser()
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password.length < 6) return toast.error('New password must be at least 6 characters.')
    if (pwForm.new_password !== pwForm.confirm) return toast.error('New passwords do not match.')
    setSavingPw(true)
    try {
      await api.put('/profile/password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password updated!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Current password is incorrect.'))
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your personal information.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-6 lg:col-span-1">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.email}</p>
          {stats && (
            <div className="mt-5 grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">{stats.quizzes_completed}</p>
                <p className="text-xs text-slate-500">Quizzes</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">{stats.materials_uploaded}</p>
                <p className="text-xs text-slate-500">Materials</p>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4 p-6 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label-text">Full Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Course</label>
                <input value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} placeholder="e.g. BCA Data Science" className="input-field" />
              </div>
              <div>
                <label className="label-text">College</label>
                <input value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-text">Study Interests</label>
              <input value={form.study_interests} onChange={(e) => setForm((f) => ({ ...f, study_interests: e.target.value }))} placeholder="e.g. Machine Learning, Web Development" className="input-field" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white"><Lock size={16} /> Change Password</h2>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input type="password" placeholder="Current password" value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))} className="input-field" required />
          <input type="password" placeholder="New password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} className="input-field" required />
          <input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} className="input-field" required />
          <button type="submit" disabled={savingPw} className="btn-primary sm:col-span-3 sm:w-fit">{savingPw ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  )
}
