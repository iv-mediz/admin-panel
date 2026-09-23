import { apiUrl, hasApiBackend } from '../config/api'
import { getAccessToken } from '../auth/session'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!hasApiBackend()) {
    throw new ApiError('VITE_API_BASE_URL is not configured', 0)
  }

  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(apiUrl(path), { ...options, headers })

  let data: unknown = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      (typeof (data as { message: unknown }).message === 'string' ||
        Array.isArray((data as { message: unknown }).message))
        ? Array.isArray((data as { message: unknown[] }).message)
          ? (data as { message: string[] }).message.join(', ')
          : String((data as { message: string }).message)
        : `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return data as T
}
