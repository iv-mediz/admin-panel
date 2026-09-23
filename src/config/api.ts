/** Backend API root, e.g. `http://ivmedizbackend.repsoft.in/api/v1` (Vercel: `VITE_API_BASE_URL`). */
const raw = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const apiBaseUrl = raw.replace(/\/$/, '')

export const hasApiBackend = apiBaseUrl.length > 0

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${apiBaseUrl}/${normalized}`
}

export const devBackendHosts = new Set([
  'ivmedizbackend.repsoft.in',
  '13.207.45.84',
  'localhost',
  '127.0.0.1',
])

export function isDevBackend(): boolean {
  try {
    const host = new URL(apiBaseUrl).hostname.toLowerCase()
    return devBackendHosts.has(host)
  } catch {
    return false
  }
}
