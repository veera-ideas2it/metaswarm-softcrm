import { useQuery } from '@tanstack/react-query'
import apiClient from './client'
import type { User } from '../types'

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export async function loginApi(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/v1/auth/login', {
    email,
    password,
  })
  return data
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/v1/auth/logout')
}

export async function getMeApi(): Promise<User> {
  const { data } = await apiClient.get<User>('/v1/auth/me')
  return data
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getMeApi,
    retry: false,
  })
}
