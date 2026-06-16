import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useDealActivities, useCreateDealActivity } from '../../api/deals'
import { formatRelativeTime } from '../../utils/format'
import type { ActivityResponse } from '../../types'
import { ACTIVITY_TYPES } from '../../utils/constants'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  type: z.string().min(1),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().nullable().optional(),
  scheduled_at: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Activity type icon (emoji/text fallback)
// ---------------------------------------------------------------------------

const TYPE_EMOJI: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '📅',
  note: '📝',
  task: '✅',
  demo: '💻',
  follow_up: '🔔',
  linkedin: 'in',
  sms: '💬',
}

function ActivityTypeIcon({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm flex-shrink-0">
      {TYPE_EMOJI[type] ?? '●'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single activity row
// ---------------------------------------------------------------------------

function ActivityRow({ activity }: { activity: ActivityResponse }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex gap-3 py-3">
      <ActivityTypeIcon type={activity.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{activity.subject}</p>
          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
            {formatRelativeTime(activity.created_at)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{activity.user_name}</p>
        {activity.body && (
          <div className="mt-1">
            {expanded ? (
              <div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.body}</p>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="inline-flex items-center gap-0.5 text-xs text-gray-400 hover:text-gray-600 mt-1"
                >
                  <ChevronUp className="w-3 h-3" /> Less
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                <ChevronDown className="w-3 h-3" /> Show note
              </button>
            )}
          </div>
        )}
        {activity.scheduled_at && (
          <p className="text-xs text-gray-400 mt-0.5">
            Scheduled: {new Date(activity.scheduled_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActivityTab
// ---------------------------------------------------------------------------

interface ActivityTabProps {
  dealId: string
}

export default function ActivityTab({ dealId }: ActivityTabProps) {
  const { data, isLoading } = useDealActivities(dealId)
  const createActivity = useCreateDealActivity(dealId)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { type: 'call', subject: '', body: '', scheduled_at: '' },
    })

  const activities: ActivityResponse[] = [...(data?.data ?? [])].reverse() // newest first

  async function onSubmit(values: FormValues) {
    try {
      await createActivity.mutateAsync({
        type: values.type,
        subject: values.subject,
        body: values.body || null,
        scheduled_at: values.scheduled_at || null,
      })
      toast.success('Activity logged')
      reset({ type: 'call', subject: '', body: '', scheduled_at: '' })
    } catch {
      toast.error('Failed to log activity')
    }
  }

  return (
    <div className="py-4 space-y-6">
      {/* Log form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-700">Log Activity</h3>

        <div className="flex gap-3">
          {/* Type */}
          <div className="w-40 flex-shrink-0">
            <select
              {...register('type')}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTIVITY_TYPES.map((at) => (
                <option key={at.key} value={at.key}>{at.label}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="flex-1">
            <input
              {...register('subject')}
              type="text"
              placeholder="Subject *"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.subject && (
              <p className="mt-0.5 text-xs text-red-600">{errors.subject.message}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <textarea
          {...register('body')}
          rows={3}
          placeholder="Notes (optional)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {/* Scheduled at + submit */}
        <div className="flex items-center gap-3">
          <input
            {...register('scheduled_at')}
            type="datetime-local"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Log'}
          </button>
        </div>
      </form>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No activities yet.</p>
          <p className="text-xs mt-1">Log a call, email, or note above.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {activities.map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </div>
      )}
    </div>
  )
}
