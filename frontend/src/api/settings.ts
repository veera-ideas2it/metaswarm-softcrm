import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import apiClient from './client'
import type {
  ApiResponse,
  User,
  TeamMember,
} from '../types'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const settingsKeys = {
  profile: ['settings', 'me'] as const,
  team: ['settings', 'team'] as const,
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------
export interface UserProfileUpdate {
  full_name?: string
  avatar_url?: string
  current_password?: string
  new_password?: string
}

export interface InvitePayload {
  email: string
  role: 'admin' | 'manager' | 'rep'
}

export interface InviteResponse {
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'rep'
  temp_password: string
}

export interface RoleUpdatePayload {
  role: 'admin' | 'manager' | 'rep'
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------
async function fetchMyProfile(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/api/v1/settings/me')
  return data.data!
}

async function updateMyProfile(payload: UserProfileUpdate): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>(
    '/api/v1/settings/me',
    payload,
  )
  return data.data!
}

async function fetchTeam(): Promise<TeamMember[]> {
  const { data } = await apiClient.get<ApiResponse<TeamMember[]>>(
    '/api/v1/settings/team',
  )
  return data.data!
}

async function inviteMember(payload: InvitePayload): Promise<InviteResponse> {
  const { data } = await apiClient.post<ApiResponse<InviteResponse>>(
    '/api/v1/settings/team/invite',
    payload,
  )
  return data.data!
}

async function updateRole(
  id: string,
  payload: RoleUpdatePayload,
): Promise<TeamMember> {
  const { data } = await apiClient.patch<ApiResponse<TeamMember>>(
    `/api/v1/settings/team/${id}/role`,
    payload,
  )
  return data.data!
}

async function deactivateUser(id: string): Promise<TeamMember> {
  const { data } = await apiClient.patch<ApiResponse<TeamMember>>(
    `/api/v1/settings/team/${id}/deactivate`,
  )
  return data.data!
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useMyProfile() {
  return useQuery({
    queryKey: settingsKeys.profile,
    queryFn: fetchMyProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.profile, data)
      // Also update the auth store copy if needed (caller can do this)
    },
  })
}

export function useTeam() {
  return useQuery({
    queryKey: settingsKeys.team,
    queryFn: fetchTeam,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'manager' | 'rep' }) =>
      updateRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team })
    },
  })
}
