/** Backend API root (Vercel: `VITE_API_BASE_URL`). */
function configuredBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')
}

/** Resolved URL used for fetch (HTTPS admin uses same-origin Vercel proxy to EC2). */
export function getApiBaseUrl(): string {
  const configured = configuredBaseUrl()
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const adminOrigin = window.location.origin
    if (!configured) {
      return `${adminOrigin}/api/v1`
    }
    try {
      const apiOrigin = new URL(configured).origin
      if (apiOrigin === adminOrigin) {
        return configured
      }
    } catch {
      return `${adminOrigin}/api/v1`
    }
    // Cross-origin API (typical: HTTP EC2) — always proxy to avoid mixed content / dead HTTPS hosts.
    return `${adminOrigin}/api/v1`
  }
  return configured
}

/** @deprecated use getApiBaseUrl() — build-time value only */
export const apiBaseUrl = configuredBaseUrl()

export function hasApiBackend(): boolean {
  if (configuredBaseUrl().length > 0) return true
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return true
  }
  return false
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl()
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${normalized}`
}

export const devBackendHosts = new Set([
  'ivmedizbackend.repsoft.in',
  '13.207.45.84',
  'localhost',
  '127.0.0.1',
])

export function isDevBackend(): boolean {
  const check = configuredBaseUrl() || getApiBaseUrl()
  try {
    const host = new URL(check).hostname.toLowerCase()
    return devBackendHosts.has(host)
  } catch {
    return false
  }
}
