import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import Assistant from './pages/Assistant'
import Materials from './pages/Materials'
import Summarizer from './pages/Summarizer'
import QuestionGenerator from './pages/QuestionGenerator'
import Quiz from './pages/Quiz'
import Notes from './pages/Notes'
import ProgressPage from './pages/Progress'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import { useTheme } from './context/ThemeContext'

export default function App() {
  const { theme } = useTheme()

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/summarizer" element={<Summarizer />} />
          <Route path="/questions" element={<QuestionGenerator />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
