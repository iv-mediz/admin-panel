import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@ivmediz.app')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('ivmediz-admin', '1')
      navigate('/')
    }, 500)
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
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="hint">Demo access is prefilled. UI only — no backend yet.</p>
        </form>
      </section>
    </div>
  )
}
