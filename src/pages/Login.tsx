import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendAdminOtp, verifyAdminOtp } from '../api/auth'
import { ApiError } from '../api/http'
import { apiBaseUrl, hasApiBackend, isDevBackend } from '../config/api'
import { setApiSession, setMockSession } from '../auth/session'

const DEV_OTP = '123456'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@ivmediz.app')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const otpValue = otp.join('')
  const showDevOtp = (isDevBackend() || !hasApiBackend) && !!devOtp

  async function sendOtp(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (hasApiBackend) {
        const result = await sendAdminOtp(email.trim())
        setDevOtp(result.devOtp ?? (isDevBackend() ? DEV_OTP : null))
      } else {
        setDevOtp(DEV_OTP)
      }
      setOtp(['', '', '', '', '', ''])
      setStep('otp')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault()
    if (otpValue.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      if (hasApiBackend) {
        const result = await verifyAdminOtp(email.trim(), otpValue)
        setApiSession(result.accessToken, result.user)
      } else if (otpValue === DEV_OTP) {
        setMockSession()
      } else {
        throw new ApiError('Invalid OTP', 401)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'OTP verification failed.')
    } finally {
      setLoading(false)
    }
  }

  function onOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function onOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function applyDevOtp() {
    if (!devOtp) return
    setOtp(devOtp.split('').slice(0, 6))
    otpRefs.current[5]?.focus()
  }

  return (
    <div className="login">
      <section className="login-art">
        <div>
          <img src="/mediz_logo.jpg" alt="iv mediz" />
          <h2>iv mediz</h2>
          <p>
            Jobs. Ambulance. Care. Manage healthcare openings, professionals and emergency
            bookings from one place.
          </p>
          <div className="login-pills">
            <span>Healthcare Jobs</span>
            <span>Ambulance Dispatch</span>
            <span>Partner Hospitals</span>
          </div>
        </div>
        <p>Integrated medical solutions for hospitals and families.</p>
      </section>
      <section className="login-form">
        {step === 'email' ? (
          <form className="login-box" onSubmit={sendOtp}>
            <h3>Welcome back</h3>
            <p>Sign in to the iv mediz admin panel with email OTP</p>
            {hasApiBackend ? (
              <p className="hint" style={{ marginBottom: 12 }}>
                API: <code>{apiBaseUrl}</code>
              </p>
            ) : (
              <p className="hint" style={{ marginBottom: 12 }}>
                Set <code>VITE_API_BASE_URL</code> in Vercel (or <code>.env.local</code>) to
                connect the backend.
              </p>
            )}
            <div className="field">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </div>
            {error ? (
              <p className="hint" style={{ color: '#b91c1c', marginTop: 8 }}>
                {error}
              </p>
            ) : null}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="login-box" onSubmit={verifyOtp}>
            <h3>Verify OTP</h3>
            <p>Enter the 6-digit code sent to {email}</p>
            {showDevOtp ? (
              <button type="button" className="dev-otp-banner" onClick={applyDevOtp}>
                <span>Dev OTP (tap to fill)</span>
                <strong>{devOtp}</strong>
              </button>
            ) : null}
            <div className="otp-row" role="group" aria-label="One-time password">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el
                  }}
                  className="otp-box"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onOtpChange(i, e.target.value)}
                  onKeyDown={(e) => onOtpKeyDown(i, e)}
                />
              ))}
            </div>
            {error ? (
              <p className="hint" style={{ color: '#b91c1c', marginTop: 8 }}>
                {error}
              </p>
            ) : null}
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              disabled={loading || otpValue.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              type="button"
              className="btn"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => {
                setStep('email')
                setError(null)
                setOtp(['', '', '', '', '', ''])
              }}
            >
              Change email
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
