import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  type ActivityResponse,
} from '../api/activities'
import apiClient from '../api/client'
import type { ApiResponse, User } from '../types'
import { useAuthStore } from '../store/authStore'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import { formatDate } from '../utils/format'

// ---------------------------------------------------------------------------
// Activity type config
// ---------------------------------------------------------------------------

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'task'] as const
type ActivityType = (typeof ACTIVITY_TYPES)[number]

const typeConfig: Record<
  ActivityType,
  { letter: string; bg: string; text: string; label: string }
> = {
  call: {
    letter: 'C',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Call',
  },
  email: {
    letter: 'E',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'Email',
  },
  meeting: {
    letter: 'M',
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Meeting',
  },
  note: {
    letter: 'N',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Note',
  },
  task: {
    letter: 'T',
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Task',
  },
}

function TypeIcon({ type }: { type: string }) {
  const cfg =
    typeConfig[type as ActivityType] ?? {
      letter: type[0].toUpperCase(),
      bg: 'bg-gray-100',
      text: 'text-gray-700',
    }
  return (
    <span
      className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.letter}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Create activity form schema
// ---------------------------------------------------------------------------

const createActivitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES, { required_error: 'Type is required' }),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional().nullable(),
  scheduled_at: z.string().optional().nullable(),
  deal_id: z.string().optional().nullable(),
  contact_id: z.string().optional().nullable(),
})

type CreateActivityForm = z.infer<typeof createActivitySchema>

// ---------------------------------------------------------------------------
// Type filter dropdown
// ---------------------------------------------------------------------------

interface TypeFilterDropdownProps {
  selected: Set<string>
  onToggle: (t: string) => void
}

function TypeFilterDropdown({ selected, onToggle }: TypeFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  const label =
    selected.size === 0
      ? 'All Types'
      : selected.size === 1
        ? typeConfig[[...selected][0] as ActivityType]?.label ?? [...selected][0]
        : `${selected.size} types`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        {label}
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {ACTIVITY_TYPES.map((t) => (
            <label
              key={t}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(t)}
                onChange={() => onToggle(t)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              {typeConfig[t].label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Create Activity Modal
// ---------------------------------------------------------------------------

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
}

function CreateActivityModal({ isOpen, onClose }: CreateActivityModalProps) {
  const createActivity = useCreateActivity()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateActivityForm>({
    resolver: zodResolver(createActivitySchema),
  })

  const onSubmit = async (data: CreateActivityForm) => {
    await createActivity.mutateAsync({
      type: data.type,
      subject: data.subject,
      body: data.body || null,
      scheduled_at: data.scheduled_at || null,
      deal_id: data.deal_id || null,
      contact_id: data.contact_id || null,
    })
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Activity" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select type —</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeConfig[t].label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            {...register('subject')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description..."
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-red-500">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('body')}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Additional notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled At
          </label>
          <input
            {...register('scheduled_at')}
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deal ID (optional)
          </label>
          <input
            {...register('deal_id')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deal UUID..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact ID (optional)
          </label>
          <input
            {...register('contact_id')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contact UUID..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Log Activity'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Activity row (with expand and task-complete)
// ---------------------------------------------------------------------------

interface ActivityRowProps {
  activity: ActivityResponse
}

function ActivityRow({ activity }: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false)
  const updateActivity = useUpdateActivity()

  const isCompleted = !!activity.completed_at
  const isTask = activity.type === 'task'

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateActivity.mutateAsync({
      id: activity.id,
      payload: {
        completed_at: isCompleted ? null : new Date().toISOString(),
      },
    })
  }

  const rowClass = isCompleted
    ? 'opacity-60'
    : 'hover:bg-gray-50 transition-colors'

  return (
    <>
      <tr
        className={`cursor-pointer ${rowClass}`}
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isTask && (
              <button
                onClick={handleComplete}
                className="flex-shrink-0 h-4 w-4 rounded border border-gray-400 flex items-center justify-center hover:border-blue-500"
                aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
              >
                {isCompleted && (
                  <svg
                    className="h-3 w-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )}
            <TypeIcon type={activity.type} />
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`font-medium text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}
          >
            {activity.subject}
          </span>
        </td>
        <td className="px-4 py-3">
          {activity.deal_id ? (
            <Link
              to={`/deals/${activity.deal_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline text-sm"
            >
              {activity.deal_title ?? activity.deal_id}
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          {activity.contact_id ? (
            <Link
              to={`/contacts/${activity.contact_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline text-sm"
            >
              {activity.contact_name ?? activity.contact_id}
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{activity.user_name}</td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {formatDate(activity.created_at)}
        </td>
        <td className="px-4 py-3">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {expanded && activity.body && (
        <tr className="bg-gray-50">
          <td />
          <td colSpan={6} className="px-4 pb-3 pt-1 text-sm text-gray-600">
            {activity.body}
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Team member shape
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ActivitiesPage() {
  const currentUser = useAuthStore((s) => s.user)
  const isManagerOrAdmin =
    currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const [myOnly, setMyOnly] = useState(true)
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  // Build API params — only pass type when exactly one is selected (API takes single value)
  // For multiple types we pass none and filter client-side for now
  const singleType =
    typeFilters.size === 1 ? [...typeFilters][0] : undefined

  const effectiveUserId = myOnly
    ? currentUser?.id
    : userFilter || undefined

  const { data, isLoading, isError } = useActivities({
    type: singleType,
    user_id: effectiveUserId,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page: 25,
  })

  // Fetch team for manager/admin owner dropdown
  const { data: teamData } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<ApiResponse<TeamMember[]>>(
        '/v1/settings/team',
      )
      return res.data ?? []
    },
    enabled: isManagerOrAdmin,
    staleTime: 1000 * 60 * 5,
  })

  const team: TeamMember[] = teamData ?? []

  // Client-side multi-type filter (if more than 1 selected)
  let activities = data?.data ?? []
  if (typeFilters.size > 1) {
    activities = activities.filter((a) => typeFilters.has(a.type))
  }

  const totalPages = data?.meta?.total_pages ?? 1

  const toggleTypeFilter = useCallback((t: string) => {
    setTypeFilters((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
    setPage(1)
  }, [])

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Log Activity
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* My / All toggle */}
        <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => {
              setMyOnly(true)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              myOnly
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            My Activities
          </button>
          <button
            onClick={() => {
              setMyOnly(false)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !myOnly
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {/* Type filter */}
        <TypeFilterDropdown selected={typeFilters} onToggle={toggleTypeFilter} />

        {/* Owner dropdown — managers/admins only */}
        {isManagerOrAdmin && !myOnly && (
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value)
              setPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Owners</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Date From */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1">
          <label className="text-sm text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load activities. Please try again.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Deal
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Owner
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : activities.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No activities found.
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create Modal */}
      <CreateActivityModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
