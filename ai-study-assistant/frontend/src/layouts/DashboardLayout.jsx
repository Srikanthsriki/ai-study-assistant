import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, FolderOpen, Sparkles, HelpCircle,
  ClipboardCheck, NotebookPen, TrendingUp, UserCircle, Settings as SettingsIcon,
  LogOut, Menu, X, Sun, Moon, Search, Bell,
} from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/materials', icon: FolderOpen, label: 'Study Materials' },
  { to: '/summarizer', icon: Sparkles, label: 'Summarizer' },
  { to: '/questions', icon: HelpCircle, label: 'Question Generator' },
  { to: '/quiz', icon: ClipboardCheck, label: 'Quiz' },
  { to: '/notes', icon: NotebookPen, label: 'My Notes' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-slate-100 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <Logo size="sm" />
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search..."
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
            </button>
            <NavLink to="/profile" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">{user?.name}</span>
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
