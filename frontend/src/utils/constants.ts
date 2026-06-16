/**
 * Application-wide constants for SoftCRM.
 */

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

export interface PipelineStage {
  key: string
  label: string
  probability: number
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { key: 'Lead', label: 'Lead', probability: 10 },
  { key: 'Qualified', label: 'Qualified', probability: 20 },
  { key: 'Meeting Scheduled', label: 'Meeting Scheduled', probability: 30 },
  { key: 'Proposal Sent', label: 'Proposal Sent', probability: 40 },
  { key: 'Negotiation', label: 'Negotiation', probability: 50 },
  { key: 'Contract Sent', label: 'Contract Sent', probability: 60 },
  { key: 'Legal Review', label: 'Legal Review', probability: 70 },
  { key: 'Procurement', label: 'Procurement', probability: 75 },
  { key: 'Verbal Commit', label: 'Verbal Commit', probability: 85 },
  { key: 'Closed Won', label: 'Closed Won', probability: 100 },
  { key: 'Closed Lost', label: 'Closed Lost', probability: 0 },
  { key: 'On Hold', label: 'On Hold', probability: 25 },
]

/** Active (non-terminal) stages that appear in the Kanban pipeline view. */
export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => s.key !== 'Closed Won' && s.key !== 'Closed Lost'
)

// ---------------------------------------------------------------------------
// Deal types
// ---------------------------------------------------------------------------

export interface DealType {
  key: string
  label: string
}

export const DEAL_TYPES: DealType[] = [
  { key: 'new_business', label: 'New Business' },
  { key: 'expansion', label: 'Expansion' },
  { key: 'renewal', label: 'Renewal' },
]

// ---------------------------------------------------------------------------
// Activity types
// ---------------------------------------------------------------------------

export interface ActivityType {
  key: string
  label: string
  /** lucide-react icon name */
  icon: string
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { key: 'call', label: 'Call', icon: 'Phone' },
  { key: 'email', label: 'Email', icon: 'Mail' },
  { key: 'meeting', label: 'Meeting', icon: 'CalendarDays' },
  { key: 'note', label: 'Note', icon: 'StickyNote' },
  { key: 'task', label: 'Task', icon: 'CheckSquare' },
  { key: 'demo', label: 'Demo', icon: 'Monitor' },
  { key: 'follow_up', label: 'Follow Up', icon: 'Bell' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { key: 'sms', label: 'SMS', icon: 'MessageSquare' },
]

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const

export const COMPANY_SIZES = [
  { key: 'startup', label: 'Startup' },
  { key: 'smb', label: 'SMB' },
  { key: 'mid_market', label: 'Mid-Market' },
  { key: 'enterprise', label: 'Enterprise' },
] as const

export const USER_ROLES = [
  { key: 'admin', label: 'Admin' },
  { key: 'manager', label: 'Manager' },
  { key: 'rep', label: 'Sales Rep' },
] as const
