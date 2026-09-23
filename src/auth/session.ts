import { hasApiBackend } from '../config/api'
import type { AdminUser } from '../api/auth'

const LEGACY_FLAG = 'ivmediz-admin'
const TOKEN_KEY = 'ivmediz-admin-token'
const USER_KEY = 'ivmediz-admin-user'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  if (hasApiBackend()) {
    return !!getAccessToken()
  }
  return localStorage.getItem(LEGACY_FLAG) === '1'
}

export function setApiSession(accessToken: string, user: AdminUser): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(LEGACY_FLAG, '1')
}

export function setMockSession(): void {
  localStorage.setItem(LEGACY_FLAG, '1')
}

export function clearSession(): void {
  localStorage.removeItem(LEGACY_FLAG)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
