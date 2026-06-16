/**
 * Formatting utilities for SoftCRM.
 */

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/**
 * Format a numeric value as a currency string.
 * @example formatCurrency(1234.56) => '$1,234.56'
 * @example formatCurrency(1234.56, 'EUR') => '€1,234.56'
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/**
 * Format a date as a human-readable relative time string.
 * @example formatRelativeTime(new Date(Date.now() - 7200000)) => '2 hours ago'
 * @example formatRelativeTime(new Date(Date.now() - 86400000 * 3)) => '3 days ago'
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()

  if (diff < MINUTE) {
    const s = Math.floor(diff / SECOND)
    return s <= 1 ? 'just now' : `${s} seconds ago`
  }
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return m === 1 ? '1 minute ago' : `${m} minutes ago`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return h === 1 ? '1 hour ago' : `${h} hours ago`
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY)
    return d === 1 ? 'yesterday' : `${d} days ago`
  }
  if (diff < MONTH) {
    const w = Math.floor(diff / WEEK)
    return w === 1 ? '1 week ago' : `${w} weeks ago`
  }
  if (diff < YEAR) {
    const mo = Math.floor(diff / MONTH)
    return mo === 1 ? '1 month ago' : `${mo} months ago`
  }
  const y = Math.floor(diff / YEAR)
  return y === 1 ? '1 year ago' : `${y} years ago`
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date as a readable string.
 * @example formatDate(new Date('2026-12-15')) => 'Dec 15, 2026'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

// ---------------------------------------------------------------------------
// Stage badge color
// ---------------------------------------------------------------------------

/**
 * Return a Tailwind CSS color class for a pipeline stage badge.
 */
export function getStageBadgeColor(stage: string): string {
  const map: Record<string, string> = {
    // Legacy stage names
    'Lead': 'bg-gray-100 text-gray-700',
    'Qualified': 'bg-blue-100 text-blue-700',
    'Meeting Scheduled': 'bg-cyan-100 text-cyan-700',
    'Proposal Sent': 'bg-violet-100 text-violet-700',
    'Negotiation': 'bg-amber-100 text-amber-700',
    'Contract Sent': 'bg-orange-100 text-orange-700',
    'Legal Review': 'bg-yellow-100 text-yellow-700',
    'Procurement': 'bg-indigo-100 text-indigo-700',
    'Verbal Commit': 'bg-teal-100 text-teal-700',
    'Closed Won': 'bg-green-100 text-green-700',
    'Closed Lost': 'bg-red-100 text-red-700',
    'On Hold': 'bg-slate-100 text-slate-700',
    // Backend v1 stage names
    'MQL': 'bg-blue-100 text-blue-700',
    'Discovery Call': 'bg-cyan-100 text-cyan-700',
    'Demo Scheduled': 'bg-sky-100 text-sky-700',
    'Demo Done': 'bg-indigo-100 text-indigo-700',
    'Technical Validation': 'bg-violet-100 text-violet-700',
    'Security Review': 'bg-purple-100 text-purple-700',
    'Won': 'bg-green-100 text-green-700',
    'Lost': 'bg-red-100 text-red-700',
  }
  return map[stage] ?? 'bg-gray-100 text-gray-600'
}

// ---------------------------------------------------------------------------
// Activity type icon (lucide-react icon names)
// ---------------------------------------------------------------------------

/**
 * Return the lucide-react icon name for an activity type.
 */
export function getActivityTypeIcon(type: string): string {
  const map: Record<string, string> = {
    call: 'Phone',
    email: 'Mail',
    meeting: 'CalendarDays',
    note: 'StickyNote',
    task: 'CheckSquare',
    demo: 'Monitor',
    follow_up: 'Bell',
    linkedin: 'Linkedin',
    sms: 'MessageSquare',
  }
  return map[type] ?? 'Circle'
}

// ---------------------------------------------------------------------------
// Deal type label
// ---------------------------------------------------------------------------

/**
 * Return a human-readable label for a deal type value.
 */
export function getDealTypeLabel(type: string): string {
  const map: Record<string, string> = {
    new_business: 'New Business',
    expansion: 'Expansion',
    renewal: 'Renewal',
  }
  return map[type] ?? type
}
