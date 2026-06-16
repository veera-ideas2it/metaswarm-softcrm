import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'
import { useCompany } from '../api/companies'
import type { CompanyContactItem, CompanyDealItem } from '../types'
import { formatCurrency, formatDate, getStageBadgeColor } from '../utils/format'

// ---------------------------------------------------------------------------
// Size badge
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
  if (!size) return null
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        SIZE_BADGE[size] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {SIZE_LABELS[size] ?? size}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Contacts tab
// ---------------------------------------------------------------------------
function ContactsTab({ contacts }: { contacts: CompanyContactItem[] }) {
  if (contacts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        No contacts linked to this company yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Name
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Title
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="py-3 pr-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Decision Maker
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pl-6 pr-4 font-semibold text-gray-900">
                {c.first_name} {c.last_name}
              </td>
              <td className="py-3 pr-4 text-gray-600">{c.title ?? '—'}</td>
              <td className="py-3 pr-4 text-gray-600">
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {c.email}
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="py-3 pr-6">
                {c.is_decision_maker ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                    Decision Maker
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Deals tab
// ---------------------------------------------------------------------------
function DealsTab({ deals }: { deals: CompanyDealItem[] }) {
  if (deals.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        No deals linked to this company yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Title
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Stage
            </th>
            <th className="py-3 pr-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Value
            </th>
            <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Owner
            </th>
            <th className="py-3 pr-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Close Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {deals.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pl-6 pr-4 font-medium text-gray-900">
                <Link
                  to={`/deals/${d.id}`}
                  className="text-indigo-600 hover:underline"
                >
                  {d.title}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    getStageBadgeColor(d.stage),
                  )}
                >
                  {d.stage}
                </span>
              </td>
              <td className="py-3 pr-4 text-right text-gray-700 font-medium">
                {formatCurrency(d.value)}
              </td>
              <td className="py-3 pr-4 text-gray-600">{d.owner_name}</td>
              <td className="py-3 pr-6 text-gray-600">
                {d.expected_close_date ? formatDate(d.expected_close_date) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type TabId = 'contacts' | 'deals'

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabId>('contacts')
  const { data: company, isLoading, isError } = useCompany(id!)

  if (isLoading) return <ProfileSkeleton />

  if (isError || !company) {
    return (
      <div className="space-y-4">
        <Link
          to="/companies"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Companies
        </Link>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          Company not found or failed to load.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        to="/companies"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Companies
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>

            {company.domain && (
              <p className="text-sm text-gray-500">{company.domain}</p>
            )}

            {company.industry && (
              <p className="text-sm text-gray-600">{company.industry}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap pt-1">
              {company.size && <SizeBadge size={company.size} />}

              {company.website && (
                <a
                  href={
                    company.website.startsWith('http')
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                >
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {company.country && (
                <span className="text-sm text-gray-500">{company.country}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {company.contact_count}
              </p>
              <p className="text-xs text-gray-500">Contacts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {company.deal_count}
              </p>
              <p className="text-xs text-gray-500">Deals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(company.total_arr)}
              </p>
              <p className="text-xs text-gray-500">Total ARR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 flex">
          {(['contacts', 'deals'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-6 py-4 text-sm font-medium capitalize transition-colors border-b-2',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab === 'contacts'
                ? `Contacts (${company.contacts.length})`
                : `Deals (${company.deals.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'contacts' ? (
          <ContactsTab contacts={company.contacts} />
        ) : (
          <DealsTab deals={company.deals} />
        )}
      </div>
    </div>
  )
}
