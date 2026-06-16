import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useCreateDeal } from '../../api/deals'
import type { ContactResponse } from '../../types'
import client from '../../api/client'
import { DEAL_TYPES } from '../../utils/constants'

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  company_id: z.string().nullable().optional(),
  primary_contact_id: z.string().nullable().optional(),
  value: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().nullable().optional(),
  ),
  expected_close_date: z.string().nullable().optional(),
  deal_type: z.string().optional(),
  product_line: z.string().nullable().optional(),
  owner_id: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Company / Contact search helpers
// ---------------------------------------------------------------------------

interface CompanyOption {
  id: string
  name: string
}

interface ContactOption {
  id: string
  first_name: string
  last_name: string
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDealSlideOver({ isOpen, onClose, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user)
  const canPickOwner = user?.role === 'admin' || user?.role === 'manager'

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        title: '',
        company_id: null,
        primary_contact_id: null,
        value: null,
        expected_close_date: null,
        deal_type: 'new_business',
        product_line: null,
        owner_id: user?.id ?? null,
      },
    })

  const createDeal = useCreateDeal()

  // Company search
  const [companyQuery, setCompanyQuery] = useState('')
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const debouncedCompanyQuery = useDebounce(companyQuery, 300)

  useEffect(() => {
    if (!debouncedCompanyQuery) {
      setCompanies([])
      return
    }
    client
      .get<{ data: CompanyOption[] }>('/v1/companies', { params: { q: debouncedCompanyQuery } })
      .then((r) => setCompanies(r.data.data ?? []))
      .catch(() => setCompanies([]))
  }, [debouncedCompanyQuery])

  // Contact search (filtered by company)
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(null)
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const selectedCompanyId = selectedCompany?.id

  useEffect(() => {
    const params: Record<string, string> = {}
    if (selectedCompanyId) params.company_id = selectedCompanyId
    client
      .get<{ data: ContactOption[] }>('/v1/contacts', { params })
      .then((r) => setContacts(r.data.data ?? []))
      .catch(() => setContacts([]))
  }, [selectedCompanyId])

  const filteredContacts = contacts.filter((c) => {
    if (!contactQuery) return true
    const full = `${c.first_name} ${c.last_name}`.toLowerCase()
    return full.includes(contactQuery.toLowerCase())
  })

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      reset({ deal_type: 'new_business', owner_id: user?.id ?? null })
      setSelectedCompany(null)
      setSelectedContact(null)
      setCompanyQuery('')
      setContactQuery('')
    }
  }, [isOpen, reset, user?.id])

  async function onSubmit(values: FormValues) {
    try {
      await createDeal.mutateAsync({
        title: values.title,
        company_id: values.company_id ?? null,
        primary_contact_id: values.primary_contact_id ?? null,
        value: values.value ?? null,
        expected_close_date: values.expected_close_date ?? null,
        deal_type: values.deal_type,
        product_line: values.product_line ?? null,
        owner_id: values.owner_id ?? user?.id ?? null,
      })
      toast.success('Deal created')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to create deal')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Deal</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Acme Corp Enterprise License"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Company */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            {selectedCompany ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm">
                <span className="flex-1 text-gray-900">{selectedCompany.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany(null)
                    setValue('company_id', null)
                    setValue('primary_contact_id', null)
                    setSelectedContact(null)
                    setCompanyQuery('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={companyQuery}
                  onChange={(e) => {
                    setCompanyQuery(e.target.value)
                    setShowCompanyDropdown(true)
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  placeholder="Search companies..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showCompanyDropdown && companies.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {companies.map((c) => (
                      <li
                        key={c.id}
                        onMouseDown={() => {
                          setSelectedCompany(c)
                          setValue('company_id', c.id)
                          setCompanyQuery('')
                          setShowCompanyDropdown(false)
                        }}
                        className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer"
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
            {selectedContact ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm">
                <span className="flex-1 text-gray-900">
                  {selectedContact.first_name} {selectedContact.last_name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null)
                    setValue('primary_contact_id', null)
                    setContactQuery('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={contactQuery}
                  onChange={(e) => {
                    setContactQuery(e.target.value)
                    setShowContactDropdown(true)
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder={selectedCompany ? 'Search contacts...' : 'Select company first'}
                  disabled={!selectedCompany}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {showContactDropdown && filteredContacts.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredContacts.map((c) => (
                      <li
                        key={c.id}
                        onMouseDown={() => {
                          setSelectedContact(c as ContactResponse)
                          setValue('primary_contact_id', c.id)
                          setContactQuery('')
                          setShowContactDropdown(false)
                        }}
                        className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer"
                      >
                        {c.first_name} {c.last_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">$</span>
              <input
                {...register('value')}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
            <input
              {...register('expected_close_date')}
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Deal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
            <select
              {...register('deal_type')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {DEAL_TYPES.map((dt) => (
                <option key={dt.key} value={dt.key}>{dt.label}</option>
              ))}
            </select>
          </div>

          {/* Product Line */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Line</label>
            <input
              {...register('product_line')}
              type="text"
              placeholder="e.g. Enterprise Suite"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Owner (manager/admin only) */}
          {canPickOwner && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner ID</label>
              <input
                {...register('owner_id')}
                type="text"
                placeholder="User ID"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Leave blank to assign to yourself</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-deal-form"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Deal'}
          </button>
        </div>
      </div>
    </>
  )
}
