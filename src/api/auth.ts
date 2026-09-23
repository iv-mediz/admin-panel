import { apiRequest } from './http'

export type AdminUser = {
  id: string
  email: string
  role: string
}

export type AdminLoginResponse = {
  accessToken: string
  user: AdminUser
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>('auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchHealth(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('health')
}
