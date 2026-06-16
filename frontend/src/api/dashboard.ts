import { useQuery } from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse } from '../types'

export interface StageCount {
  stage: string
  count: number
  value: number
}

export interface ClosingSoonDeal {
  id: string
  title: string
  company: string
  value: number | null
  expected_close_date: string | null
  owner: string
}

export interface RecentActivityUser {
  id: string
  full_name: string
  avatar_url: string | null
}

export interface RecentActivity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  deal_id: string | null
  user: RecentActivityUser
  created_at: string
}

export interface DealsWonThisMonth {
  count: number
  value: number
}

export interface DashboardData {
  total_pipeline_value: number
  deals_won_this_month: DealsWonThisMonth
  win_rate_percent: number
  avg_deal_size: number
  pipeline_by_stage: StageCount[]
  deals_closing_soon: ClosingSoonDeal[]
  recent_activities: RecentActivity[]
}

export async function getDashboardApi(): Promise<DashboardData> {
  const { data } = await apiClient.get<ApiResponse<DashboardData>>(
    '/v1/reports/dashboard',
  )
  return data.data!
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardApi,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
