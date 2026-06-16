import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type {
  DealListItem,
  DealResponse,
  DealUpdate,
  ActivityResponse,
  StageHistoryResponse,
  PaginatedResponse,
  ApiResponse,
} from '../types'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params: DealsParams) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  activities: (id: string) => [...dealKeys.detail(id), 'activities'] as const,
  stageHistory: (id: string) => [...dealKeys.detail(id), 'stage-history'] as const,
}

// ---------------------------------------------------------------------------
// Params & API functions
// ---------------------------------------------------------------------------

export interface DealsParams {
  owner_id?: string | null
  stage?: string | null
  deal_type?: string | null
  page?: number
  per_page?: number
}

export async function fetchDeals(params: DealsParams = {}): Promise<PaginatedResponse<DealListItem>> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== ''),
  )
  const { data } = await client.get<PaginatedResponse<DealListItem>>('/api/v1/deals', { params: cleaned })
  return data
}

export async function fetchDeal(id: string): Promise<DealResponse> {
  const { data } = await client.get<ApiResponse<DealResponse>>(`/api/v1/deals/${id}`)
  return data.data
}

export async function createDeal(payload: DealCreate): Promise<DealResponse> {
  const { data } = await client.post<ApiResponse<DealResponse>>('/api/v1/deals', payload)
  return data.data
}

export async function updateDeal(id: string, payload: Partial<DealUpdate>): Promise<DealResponse> {
  const { data } = await client.patch<ApiResponse<DealResponse>>(`/api/v1/deals/${id}`, payload)
  return data.data
}

export async function deleteDeal(id: string): Promise<void> {
  await client.delete(`/api/v1/deals/${id}`)
}

export async function updateDealStage(id: string, stage: string): Promise<DealResponse> {
  const { data } = await client.patch<ApiResponse<DealResponse>>(`/api/v1/deals/${id}/stage`, { stage })
  return data.data
}

export async function fetchDealActivities(id: string): Promise<PaginatedResponse<ActivityResponse>> {
  const { data } = await client.get<PaginatedResponse<ActivityResponse>>(`/api/v1/deals/${id}/activities`)
  return data
}

export async function createDealActivity(
  id: string,
  payload: ActivityCreate,
): Promise<ActivityResponse> {
  const { data } = await client.post<ApiResponse<ActivityResponse>>(
    `/api/v1/deals/${id}/activities`,
    payload,
  )
  return data.data
}

export async function fetchDealStageHistory(id: string): Promise<StageHistoryResponse[]> {
  const { data } = await client.get<ApiResponse<StageHistoryResponse[]>>(
    `/api/v1/deals/${id}/stage-history`,
  )
  return data.data
}

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface DealCreate {
  title: string
  company_id?: string | null
  primary_contact_id?: string | null
  value?: number | null
  currency?: string
  expected_close_date?: string | null
  deal_type?: string
  product_line?: string | null
  owner_id?: string | null
  stage?: string
}

export interface ActivityCreate {
  type: string
  subject: string
  body?: string | null
  scheduled_at?: string | null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useDeals(params: DealsParams = {}) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => fetchDeals(params),
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => fetchDeal(id),
    enabled: Boolean(id),
  })
}

export function useCreateDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DealCreate) => createDeal(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useUpdateDeal(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<DealUpdate>) => updateDeal(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData(dealKeys.detail(id), updated)
      qc.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useDeleteDeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useUpdateDealStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateDealStage(id, stage),
    onSuccess: (updated) => {
      qc.setQueryData(dealKeys.detail(updated.id), updated)
      qc.invalidateQueries({ queryKey: dealKeys.lists() })
    },
  })
}

export function useDealActivities(id: string) {
  return useQuery({
    queryKey: dealKeys.activities(id),
    queryFn: () => fetchDealActivities(id),
    enabled: Boolean(id),
  })
}

export function useCreateDealActivity(dealId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ActivityCreate) => createDealActivity(dealId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.activities(dealId) })
    },
  })
}

export function useDealStageHistory(id: string) {
  return useQuery({
    queryKey: dealKeys.stageHistory(id),
    queryFn: () => fetchDealStageHistory(id),
    enabled: Boolean(id),
  })
}
