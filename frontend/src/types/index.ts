export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'rep'
  avatar_url: string | null
}

export interface Company {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  website: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  company_id: string | null
  avatar_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: string
  probability: number
  close_date: string | null
  owner_id: string
  contact_id: string | null
  company_id: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'task' | 'note'
  subject: string
  body: string | null
  due_at: string | null
  done_at: string | null
  user_id: string
  deal_id: string | null
  contact_id: string | null
  company_id: string | null
  created_at: string
  updated_at: string
}

export interface StageHistory {
  id: string
  deal_id: string
  from_stage: string | null
  to_stage: string
  changed_by: string
  changed_at: string
}

export interface DashboardData {
  total_deals: number
  total_value: number
  won_deals: number
  lost_deals: number
  deals_by_stage: Record<string, number>
  recent_activities: Activity[]
}

export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiResponse<T> {
  data: T
  error: string | null
  meta: PaginationMeta | null
}

export interface PaginatedResponse<T> {
  data: T[]
  error: string | null
  meta: PaginationMeta
}
