import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('asa_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('asa_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('asa_token', res.data.access_token)
    const meRes = await api.get('/auth/me')
    setUser(meRes.data)
    return meRes.data
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('asa_token', res.data.access_token)
    const meRes = await api.get('/auth/me')
    setUser(meRes.data)
    return meRes.data
  }

  const logout = () => {
    localStorage.removeItem('asa_token')
    setUser(null)
  }

  const refreshUser = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
