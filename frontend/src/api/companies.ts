import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import apiClient from './client'
import type {
  PaginatedResponse,
  ApiResponse,
  CompanyListItem,
  CompanyResponse,
} from '../types'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (params: CompanyListParams) =>
    [...companyKeys.lists(), params] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
}

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------
export interface CompanyListParams {
  q?: string
  page?: number
  per_page?: number
}

export interface CreateCompanyPayload {
  name: string
  domain?: string
  industry?: string
  size?: string
  website?: string
  country?: string
}

export interface UpdateCompanyPayload {
  name?: string
  domain?: string
  industry?: string
  size?: string
  website?: string
  country?: string
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------
async function fetchCompanies(
  params: CompanyListParams,
): Promise<PaginatedResponse<CompanyListItem>> {
  const { data } = await apiClient.get<PaginatedResponse<CompanyListItem>>(
    '/api/v1/companies',
    { params },
  )
  return data
}

async function fetchCompany(id: string): Promise<CompanyResponse> {
  const { data } = await apiClient.get<ApiResponse<CompanyResponse>>(
    `/api/v1/companies/${id}`,
  )
  return data.data!
}

async function createCompany(
  payload: CreateCompanyPayload,
): Promise<CompanyResponse> {
  const { data } = await apiClient.post<ApiResponse<CompanyResponse>>(
    '/api/v1/companies',
    payload,
  )
  return data.data!
}

async function updateCompany(
  id: string,
  payload: UpdateCompanyPayload,
): Promise<CompanyResponse> {
  const { data } = await apiClient.patch<ApiResponse<CompanyResponse>>(
    `/api/v1/companies/${id}`,
    payload,
  )
  return data.data!
}

async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/companies/${id}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export function useCompanies(params: CompanyListParams = {}) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => fetchCompany(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyPayload }) =>
      updateCompany(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.setQueryData(companyKeys.detail(data.id), data)
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() })
      queryClient.removeQueries({ queryKey: companyKeys.detail(id) })
    },
  })
}
