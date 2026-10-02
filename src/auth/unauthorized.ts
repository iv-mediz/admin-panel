import { clearSession, getAccessToken } from './session'

let redirecting = false

/** Clear stale admin session and return to login (invalid/expired JWT). */
export function handleUnauthorizedApi(): void {
  if (!getAccessToken() || redirecting) return
  redirecting = true
  clearSession()
  const loginPath = '/login'
  const withReason = `${loginPath}?reason=session`
  if (!window.location.pathname.startsWith(loginPath)) {
    window.location.assign(withReason)
  } else {
    redirecting = false
  }
}
