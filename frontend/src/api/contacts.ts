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

export interface ContactDealItem {
  id: string
  title: string
  stage: string
  value: number
}

export interface ContactActivityItem {
  id: string
  type: string
  subject: string
  created_at: string
}

export interface ContactListItem {
  id: string
  company_id: string | null
  company_name: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  is_decision_maker: boolean
  deal_count: number
  last_activity_date: string | null
  created_at: string
}

export interface ContactResponse extends ContactListItem {
  deals: ContactDealItem[]
  activities: ContactActivityItem[]
}

export interface CreateContactPayload {
  first_name: string
  last_name: string
  company_id?: string | null
  email?: string | null
  phone?: string | null
  title?: string | null
  is_decision_maker?: boolean
}

export interface UpdateContactPayload extends Partial<CreateContactPayload> {}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: ContactListParams) =>
    [...contactKeys.lists(), params] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
}

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface ContactListParams {
  q?: string
  company_id?: string
  is_decision_maker?: boolean
  page?: number
  per_page?: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

async function getContacts(
  params: ContactListParams,
): Promise<PaginatedResponse<ContactListItem>> {
  const searchParams: Record<string, string> = {}
  if (params.q) searchParams.q = params.q
  if (params.company_id) searchParams.company_id = params.company_id
  if (params.is_decision_maker != null)
    searchParams.is_decision_maker = String(params.is_decision_maker)
  if (params.page != null) searchParams.page = String(params.page)
  if (params.per_page != null) searchParams.per_page = String(params.per_page)

  const { data } = await apiClient.get<PaginatedResponse<ContactListItem>>(
    '/v1/contacts',
    { params: searchParams },
  )
  return data
}

async function getContact(id: string): Promise<ContactResponse> {
  const { data } = await apiClient.get<ApiResponse<ContactResponse>>(
    `/v1/contacts/${id}`,
  )
  return data.data!
}

async function createContact(
  payload: CreateContactPayload,
): Promise<ContactResponse> {
  const { data } = await apiClient.post<ApiResponse<ContactResponse>>(
    '/v1/contacts',
    payload,
  )
  return data.data!
}

async function updateContact(
  id: string,
  payload: UpdateContactPayload,
): Promise<ContactResponse> {
  const { data } = await apiClient.patch<ApiResponse<ContactResponse>>(
    `/v1/contacts/${id}`,
    payload,
  )
  return data.data!
}

async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`/v1/contacts/${id}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useContacts(params: ContactListParams = {}) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => getContacts(params),
    staleTime: 1000 * 60,
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => getContact(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContactPayload }) =>
      updateContact(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: contactKeys.lists() })
      qc.invalidateQueries({ queryKey: contactKeys.detail(id) })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}
