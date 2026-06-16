import { Link, useParams } from 'react-router-dom'
import { useContact } from '../api/contacts'
import Badge from '../components/ui/Badge'
import { formatRelativeTime, formatCurrency, getStageBadgeColor } from '../utils/format'

// ---------------------------------------------------------------------------
// Stage → Badge variant mapper
// ---------------------------------------------------------------------------

function stageToBadgeVariant(
  stage: string,
): 'blue' | 'green' | 'red' | 'gray' | 'yellow' | 'purple' {
  const lower = stage.toLowerCase()
  if (lower.includes('won')) return 'green'
  if (lower.includes('lost')) return 'red'
  if (lower.includes('proposal') || lower.includes('negotiation'))
    return 'purple'
  if (lower.includes('qualified') || lower.includes('meeting')) return 'blue'
  if (lower.includes('on hold')) return 'yellow'
  return 'gray'
}

// ---------------------------------------------------------------------------
// Activity type label
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  task: 'Task',
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ContactProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: contact, isLoading, isError } = useContact(id!)

  if (isLoading) return <ProfileSkeleton />

  if (isError || !contact) {
    return (
      <div className="space-y-4">
        <Link
          to="/contacts"
          className="inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          ← Contacts
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-red-500">
          Failed to load contact. It may have been deleted.
        </div>
      </div>
    )
  }

  const fullName = `${contact.first_name} ${contact.last_name}`

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/contacts"
        className="inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← Contacts
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar placeholder */}
          <div className="flex-shrink-0 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
            {contact.first_name[0]}
            {contact.last_name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>

            {contact.title && (
              <p className="text-gray-500 mt-0.5">{contact.title}</p>
            )}

            {contact.company_name && contact.company_id && (
              <Link
                to={`/companies/${contact.company_id}`}
                className="text-blue-600 hover:underline text-sm mt-1 inline-block"
              >
                {contact.company_name}
              </Link>
            )}

            <div className="flex flex-wrap gap-4 mt-3">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {contact.email}
                </a>
              )}

              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {contact.phone}
                </a>
              )}

              {contact.is_decision_maker && (
                <Badge label="Decision Maker" variant="green" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linked Deals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Linked Deals
          </h2>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-gray-400">No deals linked.</p>
          ) : (
            <ul className="space-y-3">
              {contact.deals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex items-center justify-between gap-3"
                >
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-sm font-medium text-blue-700 hover:underline truncate"
                  >
                    {deal.title}
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(deal.stage)}`}
                    >
                      {deal.stage}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Activity Feed
          </h2>
          {contact.activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activities yet.</p>
          ) : (
            <ul className="space-y-3">
              {contact.activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 text-gray-400 text-xs uppercase font-semibold bg-gray-100 rounded px-1.5 py-0.5">
                    {typeLabels[activity.type] ?? activity.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {activity.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
