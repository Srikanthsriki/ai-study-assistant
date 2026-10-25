import axios from 'axios'

// Vite dev server proxies /api to the FastAPI backend (see vite.config.js)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

// Attach the JWT token (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('asa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If a request comes back unauthorized, clear the session so the user
// is redirected back to login by the ProtectedRoute component.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('asa_token')
      localStorage.removeItem('asa_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper to get a friendly error message from any API error
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.detail || fallback
}

export default api
