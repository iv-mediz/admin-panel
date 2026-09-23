import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/auth'
import { ApiError } from '../api/http'
import { apiBaseUrl, hasApiBackend } from '../config/api'
import { setApiSession, setMockSession } from '../auth/session'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@ivmediz.app')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (hasApiBackend) {
        const result = await adminLogin(email.trim(), password)
        setApiSession(result.accessToken, result.user)
      } else {
        setMockSession()
      }
      navigate('/')
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Sign in failed. Check your connection.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <section className="login-art">
        <div>
          <img src="/mediz_logo.jpg" alt="iv mediz" />
          <h2>iv mediz</h2>
          <p>Jobs. Ambulance. Care. Manage healthcare openings, professionals and emergency bookings from one place.</p>
          <div className="login-pills">
            <span>Healthcare Jobs</span>
            <span>Ambulance Dispatch</span>
            <span>Partner Hospitals</span>
          </div>
        </div>
        <p>Integrated medical solutions for hospitals and families.</p>
      </section>
      <section className="login-form">
        <form className="login-box" onSubmit={onSubmit}>
          <h3>Welcome back</h3>
          <p>Sign in to the iv mediz admin panel</p>
          {hasApiBackend ? (
            <p className="hint" style={{ marginBottom: 12 }}>
              API: <code>{apiBaseUrl}</code>
            </p>
          ) : (
            <p className="hint" style={{ marginBottom: 12 }}>
              Set <code>VITE_API_BASE_URL</code> in Vercel (or <code>.env.local</code>) to connect the backend.
            </p>
          )}
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? (
            <p className="hint" style={{ color: '#b91c1c', marginTop: 8 }}>
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {!hasApiBackend ? (
            <p className="hint">Demo mode — sign-in is local only until API URL is configured.</p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
