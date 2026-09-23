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

export type SendOtpResponse = {
  success: boolean
  message: string
  devOtp?: string
}

export async function sendAdminOtp(email: string): Promise<SendOtpResponse> {
  return apiRequest<SendOtpResponse>('auth/admin/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyAdminOtp(
  email: string,
  otp: string,
): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>('auth/admin/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
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
