import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse, PaginatedResponse } from '../types'

// ---------------------------------------------------------------------------
// API shapes (per backend spec)
// ---------------------------------------------------------------------------

export interface ActivityResponse {
  id: string
  deal_id: string | null
  deal_title: string | null
  contact_id: string | null
  contact_name: string | null
  user_id: string
  user_name: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  body: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
}

export interface CreateActivityPayload {
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  body?: string | null
  scheduled_at?: string | null
  deal_id?: string | null
  contact_id?: string | null
}

export interface UpdateActivityPayload extends Partial<CreateActivityPayload> {
  completed_at?: string | null
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (params: ActivityListParams) =>
    [...activityKeys.lists(), params] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
}

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface ActivityListParams {
  type?: string
  user_id?: string
  deal_id?: string
  date_from?: string | null
  date_to?: string | null
  page?: number
  per_page?: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

async function getActivities(
  params: ActivityListParams,
): Promise<PaginatedResponse<ActivityResponse>> {
  const searchParams: Record<string, string> = {}
  if (params.type) searchParams.type = params.type
  if (params.user_id) searchParams.user_id = params.user_id
  if (params.deal_id) searchParams.deal_id = params.deal_id
  if (params.date_from) searchParams.date_from = params.date_from
  if (params.date_to) searchParams.date_to = params.date_to
  if (params.page != null) searchParams.page = String(params.page)
  if (params.per_page != null) searchParams.per_page = String(params.per_page)

  const { data } = await apiClient.get<PaginatedResponse<ActivityResponse>>(
    '/v1/activities',
    { params: searchParams },
  )
  return data
}

async function createActivity(
  payload: CreateActivityPayload,
): Promise<ActivityResponse> {
  const { data } = await apiClient.post<ApiResponse<ActivityResponse>>(
    '/v1/activities',
    payload,
  )
  return data.data!
}

async function updateActivity(
  id: string,
  payload: UpdateActivityPayload,
): Promise<ActivityResponse> {
  const { data } = await apiClient.patch<ApiResponse<ActivityResponse>>(
    `/v1/activities/${id}`,
    payload,
  )
  return data.data!
}

async function deleteActivity(id: string): Promise<void> {
  await apiClient.delete(`/v1/activities/${id}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useActivities(params: ActivityListParams = {}) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => getActivities(params),
    staleTime: 1000 * 60,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.lists() })
    },
  })
}

export function useUpdateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateActivityPayload }) =>
      updateActivity(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: activityKeys.lists() })
      qc.invalidateQueries({ queryKey: activityKeys.detail(id) })
    },
  })
}

export function useDeleteActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.lists() })
    },
  })
}
