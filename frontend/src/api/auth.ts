import apiClient from './client'
import type { User } from '../types'

interface TokenResponse {
  access_token: string
  token_type: string
}

interface UserListItem {
  id: number
  full_name: string
  email: string
  role: string
}

export async function fetchUsers(): Promise<UserListItem[]> {
  const { data } = await apiClient.get<UserListItem[]>('/auth/users')
  return data
}

export async function loginApi(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const { data } = await apiClient.post<TokenResponse>('/auth/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function registerApi(
  email: string,
  full_name: string,
  password: string,
): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', {
    email,
    full_name,
    password,
  })
  return data
}