import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import type { DealResponse, DealUpdate } from '../../types'
import { DEAL_TYPES, CURRENCIES } from '../../utils/constants'

interface OverviewTabProps {
  deal: DealResponse
  onUpdate: (data: Partial<DealUpdate>) => Promise<void>
}

// ---------------------------------------------------------------------------
// Inline-editable field
// ---------------------------------------------------------------------------

interface InlineTextProps {
  label: string
  value: string | null
  onSave: (val: string) => Promise<void>
  type?: 'text' | 'number' | 'textarea'
  placeholder?: string
  min?: number
  max?: number
}

function InlineText({
  label,
  value,
  onSave,
  type = 'text',
  placeholder = '—',
  min,
  max,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function save() {
    const trimmed = draft.trim()
    if (trimmed === (value ?? '')) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      toast.success(`${label} updated`)
    } catch {
      toast.error(`Failed to update ${label}`)
      setDraft(value ?? '')
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      await save()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setDraft(value ?? '')
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {editing ? (
        <div className="relative flex items-center">
          {type === 'textarea' ? (
            <textarea
              ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full text-sm border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <input
              ref={inputRef as unknown as React.RefObject<HTMLInputElement>}
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={handleKeyDown}
              min={min}
              max={max}
              className="w-full text-sm border border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {saving && (
            <Loader2 className="absolute right-2 w-3.5 h-3.5 text-blue-500 animate-spin" />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="text-sm text-gray-900 text-left hover:bg-gray-50 rounded px-1 py-0.5 -mx-1 transition-colors group"
        >
          <span className={value ? '' : 'text-gray-400 italic'}>{value ?? placeholder}</span>
          <span className="ml-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            edit
          </span>
        </button>
      )}
    </div>
  )
}

interface InlineSelectProps<T extends string> {
  label: string
  value: T | null
  options: { key: T; label: string }[]
  onSave: (val: T) => Promise<void>
  placeholder?: string
}

function InlineSelect<T extends string>({
  label,
  value,
  options,
  onSave,
  placeholder = '—',
}: InlineSelectProps<T>) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as T
    setSaving(true)
    try {
      await onSave(val)
      toast.success(`${label} updated`)
    } catch {
      toast.error(`Failed to update ${label}`)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const displayLabel = options.find((o) => o.key === value)?.label ?? value

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      {editing ? (
        <div className="relative flex items-center">
          <select
            value={value ?? ''}
            onChange={handleChange}
            onBlur={() => setEditing(false)}
            autoFocus
            className="w-full text-sm border border-blue-400 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {saving && (
            <Loader2 className="absolute right-6 w-3.5 h-3.5 text-blue-500 animate-spin" />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-gray-900 text-left hover:bg-gray-50 rounded px-1 py-0.5 -mx-1 transition-colors group"
        >
          <span className={displayLabel ? '' : 'text-gray-400 italic'}>{displayLabel ?? placeholder}</span>
          <span className="ml-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            edit
          </span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// OverviewTab
// ---------------------------------------------------------------------------

export default function OverviewTab({ deal, onUpdate }: OverviewTabProps) {
  const dealTypeOptions = DEAL_TYPES.map((dt) => ({ key: dt.key, label: dt.label }))
  const currencyOptions = CURRENCIES.map((c) => ({ key: c, label: c }))

  return (
    <div className="divide-y divide-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
        {/* Deal Type */}
        <InlineSelect
          label="Deal Type"
          value={deal.deal_type}
          options={dealTypeOptions}
          onSave={(val) => onUpdate({ deal_type: val })}
        />

        {/* Product Line */}
        <InlineText
          label="Product Line"
          value={deal.product_line}
          onSave={(val) => onUpdate({ product_line: val })}
          placeholder="e.g. Enterprise Suite"
        />

        {/* Probability */}
        <InlineText
          label="Probability"
          value={deal.probability != null ? String(deal.probability) : null}
          onSave={(val) => onUpdate({ probability: val ? parseInt(val, 10) : null })}
          type="number"
          min={0}
          max={100}
          placeholder="0–100"
        />

        {/* Currency */}
        <InlineSelect
          label="Currency"
          value={deal.currency as (typeof CURRENCIES)[number]}
          options={currencyOptions}
          onSave={(val) => onUpdate({ currency: val })}
        />

        {/* Primary Contact */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Primary Contact
          </span>
          <span className="text-sm text-gray-900">
            {deal.primary_contact_name ?? <span className="text-gray-400 italic">—</span>}
          </span>
        </div>

        {/* Owner */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</span>
          <span className="text-sm text-gray-900">{deal.owner_name}</span>
        </div>
      </div>

      {/* Lost Reason — only shown for Lost stage */}
      {deal.stage === 'Lost' && (
        <div className="py-6">
          <InlineText
            label="Lost Reason"
            value={deal.lost_reason}
            onSave={(val) => onUpdate({ lost_reason: val })}
            type="textarea"
            placeholder="Why was this deal lost?"
          />
        </div>
      )}
    </div>
  )
}
