import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { useDeal, useUpdateDeal, useUpdateDealStage } from '../api/deals'
import { formatCurrency, formatDate, getStageBadgeColor } from '../utils/format'
import type { DealUpdate, ContactResponse } from '../types'
import OverviewTab from '../components/deals/OverviewTab'
import ActivityTab from '../components/deals/ActivityTab'
import ContactsTab from '../components/deals/ContactsTab'
import StageHistoryTab from '../components/deals/StageHistoryTab'

// ---------------------------------------------------------------------------
// The 12 pipeline stages (ordered)
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  'Lead',
  'MQL',
  'Discovery Call',
  'Demo Scheduled',
  'Demo Done',
  'Technical Validation',
  'Security Review',
  'Proposal Sent',
  'Negotiation',
  'Contract Sent',
  'Won',
  'Lost',
]

// ---------------------------------------------------------------------------
// Stage progress bar
// ---------------------------------------------------------------------------

interface StageProgressBarProps {
  currentStage: string
  onStageClick: (stage: string) => Promise<void>
}

function StageProgressBar({ currentStage, onStageClick }: StageProgressBarProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage)
  const [loadingStage, setLoadingStage] = useState<string | null>(null)

  async function handleClick(stage: string) {
    if (stage === currentStage) return
    setLoadingStage(stage)
    try {
      await onStageClick(stage)
    } finally {
      setLoadingStage(null)
    }
  }

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-start gap-0 min-w-max">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isFuture = idx > currentIndex
          const isLoading = loadingStage === stage

          return (
            <div key={stage} className="flex flex-col items-center w-[80px] flex-shrink-0">
              {/* Connector line + dot row */}
              <div className="flex items-center w-full">
                {/* Left line */}
                <div
                  className={[
                    'flex-1 h-0.5',
                    idx === 0 ? 'invisible' : '',
                    isCompleted || isCurrent ? 'bg-blue-500' : 'bg-gray-200',
                  ].join(' ')}
                />

                {/* Dot */}
                <button
                  type="button"
                  onClick={() => handleClick(stage)}
                  disabled={isLoading}
                  title={stage}
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all flex-shrink-0 cursor-pointer',
                    isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110'
                      : isCompleted
                        ? 'bg-gray-400 border-gray-400 text-white'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600',
                    isLoading ? 'opacity-60 cursor-wait' : '',
                  ].join(' ')}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>

                {/* Right line */}
                <div
                  className={[
                    'flex-1 h-0.5',
                    idx === PIPELINE_STAGES.length - 1 ? 'invisible' : '',
                    isCompleted ? 'bg-blue-500' : 'bg-gray-200',
                  ].join(' ')}
                />
              </div>

              {/* Label */}
              <span
                className={[
                  'mt-1 text-center text-[10px] leading-tight truncate w-full px-0.5',
                  isCurrent ? 'text-blue-700 font-semibold' : 'text-gray-500',
                ].join(' ')}
                title={stage}
              >
                {stage}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline-editable title
// ---------------------------------------------------------------------------

interface InlineTitleProps {
  value: string
  onSave: (val: string) => Promise<void>
}

function InlineTitle({ value, onSave }: InlineTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function save() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      setDraft(value)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
    } catch {
      toast.error('Failed to update title')
      setDraft(value)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') await save()
    if (e.key === 'Escape') {
      setEditing(false)
      setDraft(value)
    }
  }

  if (editing) {
    return (
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent focus:outline-none w-full"
        />
        {saving && (
          <Loader2 className="absolute right-0 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="text-2xl font-bold text-gray-900 text-left hover:text-blue-700 transition-colors group"
    >
      {value}
      <span className="ml-2 text-sm font-normal text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        edit
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline-editable value
// ---------------------------------------------------------------------------

interface InlineValueProps {
  value: string | number | null
  currency: string
  onSave: (val: number | null) => Promise<void>
}

function InlineValue({ value, currency, onSave }: InlineValueProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>('')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
    setDraft(String(n))
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    try {
      const n = draft ? parseFloat(draft) : null
      await onSave(isNaN(n as number) ? null : n)
    } catch {
      toast.error('Failed to update value')
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const numericValue = (() => {
    if (value == null) return null
    const n = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(n) ? null : n
  })()

  if (editing) {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
          className="w-36 text-lg font-semibold border-b-2 border-blue-500 bg-transparent focus:outline-none"
        />
        {saving && (
          <Loader2 className="absolute right-0 w-4 h-4 text-blue-500 animate-spin" />
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="text-lg font-semibold text-green-700 hover:text-green-800 transition-colors"
    >
      {numericValue != null ? formatCurrency(numericValue, currency) : 'No value'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline-editable date
// ---------------------------------------------------------------------------

interface InlineDateProps {
  value: string | null
  label: string
  onSave: (val: string | null) => Promise<void>
}

function InlineDate({ value, label, onSave }: InlineDateProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ? value.slice(0, 10) : '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await onSave(draft || null)
    } catch {
      toast.error(`Failed to update ${label}`)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="relative inline-flex items-center gap-2">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
          className="text-sm border-b border-blue-500 bg-transparent focus:outline-none"
        />
        {saving && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
    >
      {label}: {value ? formatDate(value) : <span className="text-gray-400">—</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'activity' | 'contacts' | 'stage-history'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'stage-history', label: 'Stage History' },
]

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-1/4" />
      <div className="h-12 bg-gray-100 rounded" />
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded w-24" />
        ))}
      </div>
      <div className="h-48 bg-gray-100 rounded" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// DealDetailPage
// ---------------------------------------------------------------------------

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: deal, isLoading, isError, refetch } = useDeal(id!)
  const updateDeal = useUpdateDeal(id!)
  const updateStage = useUpdateDealStage()

  async function handleUpdate(payload: Partial<DealUpdate>) {
    await updateDeal.mutateAsync(payload)
    toast.success('Deal updated')
    refetch()
  }

  async function handleStageClick(stage: string) {
    await updateStage.mutateAsync({ id: id!, stage })
    toast.success(`Moved to ${stage}`)
    refetch()
  }

  if (isLoading) return <LoadingSkeleton />

  if (isError || !deal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-lg text-gray-500">Deal not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    )
  }

  // Build a contacts array from the deal's primary contact (simplified)
  const primaryContact: ContactResponse[] = deal.primary_contact_id
    ? [
        {
          id: deal.primary_contact_id,
          first_name: (deal.primary_contact_name ?? '').split(' ')[0] ?? '',
          last_name: (deal.primary_contact_name ?? '').split(' ').slice(1).join(' ') ?? '',
          email: null,
          phone: null,
          title: null,
          company_id: deal.company_id,
          is_decision_maker: false,
          avatar_url: null,
          created_at: deal.created_at,
          updated_at: deal.updated_at,
        },
      ]
    : []

  const stageBadge = getStageBadgeColor(deal.stage)

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Back nav */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Pipeline
        </button>
      </div>

      {/* Header */}
      <div className="px-6 pt-4 pb-4 border-b border-gray-200">
        {/* Title */}
        <InlineTitle
          value={deal.title}
          onSave={(title) => handleUpdate({ title })}
        />

        {/* Company + Stage badge */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {deal.company_id ? (
            <Link
              to={`/companies/${deal.company_id}`}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              {deal.company_name}
            </Link>
          ) : (
            <span className="text-sm text-gray-500">{deal.company_name ?? '—'}</span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadge}`}
          >
            {deal.stage}
          </span>
        </div>

        {/* Value + Close date */}
        <div className="flex items-center gap-6 mt-3 flex-wrap">
          <InlineValue
            value={deal.value}
            currency={deal.currency}
            onSave={(value) => handleUpdate({ value })}
          />
          <InlineDate
            label="Close"
            value={deal.expected_close_date}
            onSave={(expected_close_date) => handleUpdate({ expected_close_date })}
          />
        </div>

        {/* Stage progress bar */}
        <div className="mt-5">
          <StageProgressBar
            currentStage={deal.stage}
            onStageClick={handleStageClick}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-6">
        {activeTab === 'overview' && (
          <OverviewTab deal={deal} onUpdate={handleUpdate} />
        )}
        {activeTab === 'activity' && (
          <ActivityTab dealId={deal.id} />
        )}
        {activeTab === 'contacts' && (
          <ContactsTab dealId={deal.id} contacts={primaryContact} />
        )}
        {activeTab === 'stage-history' && (
          <StageHistoryTab dealId={deal.id} />
        )}
      </div>
    </div>
  )
}
