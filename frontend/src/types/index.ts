export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'rep'
  avatar_url: string | null
}

export interface TeamMember {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'rep'
  is_active: boolean
  created_at: string
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
  country: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CompanyListItem {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  contact_count: number
  deal_count: number
  total_arr: number
  created_at: string
}

export interface CompanyContactItem {
  id: string
  first_name: string
  last_name: string
  title: string | null
  email: string | null
  is_decision_maker: boolean
}

export interface CompanyDealItem {
  id: string
  title: string
  stage: string
  value: number
  owner_name: string
  expected_close_date: string | null
}

export interface CompanyResponse {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  website: string | null
  country: string | null
  contact_count: number
  deal_count: number
  total_arr: number
  created_at: string
  contacts: CompanyContactItem[]
  deals: CompanyDealItem[]
}

export interface ContactListItem {
  id: string
  first_name: string
  last_name: string
  email: string | null
  title: string | null
  company_id: string | null
  company_name: string | null
  is_decision_maker: boolean
  deal_count: number
  last_activity_date: string | null
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  company_id: string | null
  company_name: string | null
  avatar_url: string | null
  is_decision_maker: boolean
  deal_count: number
  last_activity_date: string | null
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
  expected_close_date: string | null
  owner_id: string
  owner_name: string | null
  contact_id: string | null
  primary_contact_name: string | null
  company_id: string | null
  company_name: string | null
  deal_type: 'new_business' | 'expansion' | 'renewal' | null
  product_line: string | null
  days_in_stage: number
  description: string | null
  lost_reason: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'task' | 'note'
  subject: string
  body: string | null
  scheduled_at: string | null
  completed_at: string | null
  user_id: string
  user_name: string | null
  deal_id: string | null
  deal_title: string | null
  contact_id: string | null
  contact_name: string | null
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

export interface StageHistoryEntry {
  id: string
  deal_id: string
  from_stage: string | null
  to_stage: string
  changed_by: string
  changed_at: string
}

export interface DashboardData {
  total_pipeline_value: number
  deals_won_this_month: {
    count: number
    value: number
  }
  win_rate_percent: number
  avg_deal_size: number
  pipeline_by_stage: Array<{
    stage: string
    count: number
    value: number
  }>
  deals_closing_soon: Array<{
    id: string
    title: string
    company: string
    value: number | null
    expected_close_date: string | null
    owner: string
  }>
  recent_activities: Array<{
    id: string
    type: 'call' | 'email' | 'meeting' | 'note' | 'task'
    subject: string
    deal_id: string | null
    user: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    created_at: string
  }>
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

// ---------------------------------------------------------------------------
// Backend API shapes (v1) — match exact server response fields
// ---------------------------------------------------------------------------

export interface DealListItem {
  id: string
  title: string
  company_id: string | null
  company_name: string | null
  owner_id: string
  owner_name: string
  stage: string
  value: string | number | null
  probability: number | null
  currency: string
  deal_type: string
  days_in_stage: number
}

export interface DealResponse extends DealListItem {
  primary_contact_id: string | null
  primary_contact_name: string | null
  product_line: string | null
  lost_reason: string | null
  expected_close_date: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  closed_at: string | null
}

export interface DealUpdate {
  title?: string
  company_id?: string | null
  primary_contact_id?: string | null
  value?: number | null
  currency?: string
  probability?: number | null
  expected_close_date?: string | null
  deal_type?: string
  product_line?: string | null
  owner_id?: string | null
  lost_reason?: string | null
  stage?: string
}

export interface ActivityResponse {
  id: string
  deal_id: string
  deal_title: string | null
  contact_id: string | null
  contact_name: string | null
  user_id: string
  user_name: string
  type: string
  subject: string
  body: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
}

export interface StageHistoryResponse {
  id: string
  deal_id: string
  from_stage: string | null
  to_stage: string
  changed_by: string
  changed_by_name: string
  changed_at: string
  days_in_stage: number
}

export interface ContactResponse {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  company_id: string | null
  is_decision_maker?: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}
