import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../services/api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const passwordStrength = () => {
    if (form.password.length === 0) return null
    if (form.password.length < 6) return { label: 'Too short', color: 'bg-red-500' }
    if (form.password.length < 10) return { label: 'Medium', color: 'bg-amber-500' }
    return { label: 'Strong', color: 'bg-emerald-500' }
  }
  const strength = passwordStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.name.trim().length < 2) return setError('Please enter your full name.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (!agree) return setError('Please accept the Terms to continue.')

    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account created! Welcome to AI Study Assistant.')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start learning smarter, for free.</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-text" htmlFor="name">Full Name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="name" required value={form.name} onChange={update('name')} className="input-field pl-10" placeholder="Aditi Sharma" />
              </div>
            </div>

            <div>
              <label className="label-text" htmlFor="email">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" required value={form.email} onChange={update('email')} className="input-field pl-10" placeholder="you@college.edu" />
              </div>
            </div>

            <div>
              <label className="label-text" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={update('password')}
                  className="input-field pl-10 pr-10"
                  placeholder="At least 6 characters"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-1.5 rounded-full ${strength.color}`} style={{ width: strength.label === 'Too short' ? '30%' : strength.label === 'Medium' ? '65%' : '100%' }} />
                  </div>
                  <span className="text-xs text-slate-500">{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="label-text" htmlFor="confirm">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={update('confirm')}
                  className="input-field pl-10"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              I agree to the Terms of Service and Privacy Policy
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
