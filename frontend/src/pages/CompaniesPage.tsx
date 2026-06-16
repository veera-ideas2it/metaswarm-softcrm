import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Search, ChevronUp, ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'
import {
  useCompanies,
  useCreateCompany,
} from '../api/companies'
import type { CompanyListItem } from '../types'
import { formatCurrency } from '../utils/format'
import { TableSkeleton } from '../components/ui/LoadingSkeleton'

// ---------------------------------------------------------------------------
// Size badge config
// ---------------------------------------------------------------------------
const SIZE_BADGE: Record<string, string> = {
  startup: 'bg-gray-100 text-gray-700',
  smb: 'bg-blue-100 text-blue-700',
  mid_market: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-green-100 text-green-700',
}

const SIZE_LABELS: Record<string, string> = {
  startup: 'Startup',
  smb: 'SMB',
  mid_market: 'Mid-Market',
  enterprise: 'Enterprise',
}

function SizeBadge({ size }: { size: string | null }) {
  if (!size) return <span className="text-gray-400">—</span>
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        SIZE_BADGE[size] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {SIZE_LABELS[size] ?? size}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------
type SortKey = keyof Pick<
  CompanyListItem,
  'name' | 'domain' | 'industry' | 'size' | 'contact_count' | 'deal_count' | 'total_arr'
>
type SortDir = 'asc' | 'desc'

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey
  sortDir: SortDir
}) {
  if (col !== sortKey)
    return <ChevronUp className="h-3 w-3 text-gray-300 ml-1 inline" />
  return sortDir === 'asc' ? (
    <ChevronUp className="h-3 w-3 text-gray-600 ml-1 inline" />
  ) : (
    <ChevronDown className="h-3 w-3 text-gray-600 ml-1 inline" />
  )
}

// ---------------------------------------------------------------------------
// Create company modal schema
// ---------------------------------------------------------------------------
const createSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'smb', 'mid_market', 'enterprise', '']).optional(),
  website: z.string().optional(),
  country: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

function CreateCompanyModal({ onClose }: { onClose: () => void }) {
  const createCompany = useCreateCompany()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      domain: '',
      industry: '',
      size: '',
      website: '',
      country: '',
    },
  })

  async function onSubmit(values: CreateFormValues) {
    try {
      await createCompany.mutateAsync({
        name: values.name,
        domain: values.domain || undefined,
        industry: values.industry || undefined,
        size: values.size || undefined,
        website: values.website || undefined,
        country: values.country || undefined,
      })
      toast.success('Company created')
      onClose()
    } catch {
      toast.error('Failed to create company')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">New Company</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domain
            </label>
            <input
              {...register('domain')}
              type="text"
              placeholder="acme.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              {...register('industry')}
              type="text"
              placeholder="SaaS, FinTech, Healthcare..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              {...register('size')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select size...</option>
              <option value="startup">Startup</option>
              <option value="smb">SMB</option>
              <option value="mid_market">Mid-Market</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              {...register('website')}
              type="text"
              placeholder="https://acme.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              {...register('country')}
              type="text"
              placeholder="United States"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showModal, setShowModal] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, isError } = useCompanies({
    q: debouncedSearch || undefined,
    page,
    per_page: 20,
  })

  const companies = data?.data ?? []
  const meta = data?.meta

  // Client-side sort
  const sorted = useCallback(() => {
    return [...companies].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      return sortDir === 'asc'
        ? as.localeCompare(bs)
        : bs.localeCompare(as)
    })
  }, [companies, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function ThHeader({
    col,
    children,
    className = '',
  }: {
    col: SortKey
    children: React.ReactNode
    className?: string
  }) {
    return (
      <th
        className={clsx(
          'py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 whitespace-nowrap select-none',
          className,
        )}
        onClick={() => toggleSort(col)}
      >
        {children}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </th>
    )
  }

  const sortedCompanies = sorted()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Company
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or domain..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          Failed to load companies. Please try again.
        </div>
      ) : sortedCompanies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">
            {debouncedSearch
              ? `No companies matching "${debouncedSearch}"`
              : 'No companies yet. Create your first company!'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <ThHeader col="name" className="pl-6">
                    Name
                  </ThHeader>
                  <ThHeader col="domain">Domain</ThHeader>
                  <ThHeader col="industry">Industry</ThHeader>
                  <ThHeader col="size">Size</ThHeader>
                  <ThHeader col="contact_count" className="text-center">
                    Contacts
                  </ThHeader>
                  <ThHeader col="deal_count" className="text-center">
                    Deals
                  </ThHeader>
                  <th
                    className="py-3 pr-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 whitespace-nowrap select-none"
                    onClick={() => toggleSort('total_arr')}
                  >
                    ARR
                    <SortIcon col="total_arr" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedCompanies.map((co) => (
                  <tr
                    key={co.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 pl-6 pr-4 font-semibold text-gray-900">
                      <Link
                        to={`/companies/${co.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {co.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {co.domain ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {co.industry ?? '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <SizeBadge size={co.size} />
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-700">
                      {co.contact_count}
                    </td>
                    <td className="py-3 pr-4 text-center text-gray-700">
                      {co.deal_count}
                    </td>
                    <td className="py-3 pr-6 text-right text-gray-700 font-medium">
                      {formatCurrency(co.total_arr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {meta.total} companies &bull; Page {meta.page} of{' '}
                {meta.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.total_pages, p + 1))
                  }
                  disabled={page === meta.total_pages}
                  className="px-3 py-1 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <CreateCompanyModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
