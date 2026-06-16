import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Copy, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import {
  useMyProfile,
  useUpdateProfile,
  useTeam,
  useInviteMember,
  useUpdateRole,
  useDeactivateUser,
  type InviteResponse,
} from '../api/settings'
import type { TeamMember } from '../types'
import { useAuthStore } from '../store/authStore'

// ---------------------------------------------------------------------------
// Profile tab
// ---------------------------------------------------------------------------
const profileSchema = z
  .object({
    full_name: z.string().min(1, 'Name is required'),
    avatar_url: z.string().optional(),
    current_password: z.string().optional(),
    new_password: z.string().optional(),
    confirm_password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPasswordFields =
      data.current_password || data.new_password || data.confirm_password
    if (hasPasswordFields) {
      if (!data.current_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Current password is required to change password',
          path: ['current_password'],
        })
      }
      if (!data.new_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New password is required',
          path: ['new_password'],
        })
      }
      if (data.new_password && data.new_password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New password must be at least 8 characters',
          path: ['new_password'],
        })
      }
      if (data.new_password !== data.confirm_password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['confirm_password'],
        })
      }
    }
  })

type ProfileFormValues = z.infer<typeof profileSchema>

function ProfileTab() {
  const { data: profile, isLoading } = useMyProfile()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      avatar_url: '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url ?? '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    }
  }, [profile, reset])

  const watchedValues = watch()

  async function onSubmit(values: ProfileFormValues) {
    const payload: Parameters<typeof updateProfile.mutateAsync>[0] = {}

    if (values.full_name !== profile?.full_name) {
      payload.full_name = values.full_name
    }
    const avatarVal = values.avatar_url?.trim() || undefined
    if (avatarVal !== (profile?.avatar_url ?? undefined)) {
      payload.avatar_url = avatarVal
    }
    if (values.current_password && values.new_password) {
      payload.current_password = values.current_password
      payload.new_password = values.new_password
    }

    if (Object.keys(payload).length === 0) {
      toast('No changes to save')
      return
    }

    try {
      await updateProfile.mutateAsync(payload)
      toast.success('Profile updated')
      reset({
        full_name: values.full_name,
        avatar_url: values.avatar_url,
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch {
      toast.error('Failed to update profile')
    }
  }

  // Determine if there are actual changes
  const hasChanges =
    isDirty ||
    Boolean(watchedValues.current_password) ||
    Boolean(watchedValues.new_password)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-lg">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={profile?.email ?? ''}
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
        />
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          {...register('full_name')}
          type="text"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      {/* Avatar URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Avatar URL
        </label>
        <input
          {...register('avatar_url')}
          type="text"
          placeholder="https://..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Change Password
          </span>
        </div>
      </div>

      {/* Current password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <input
          {...register('current_password')}
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.current_password && (
          <p className="mt-1 text-xs text-red-600">
            {errors.current_password.message}
          </p>
        )}
      </div>

      {/* New password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <input
          {...register('new_password')}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.new_password && (
          <p className="mt-1 text-xs text-red-600">
            {errors.new_password.message}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          {...register('confirm_password')}
          type="password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {errors.confirm_password && (
          <p className="mt-1 text-xs text-red-600">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!hasChanges || isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------
const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  rep: 'bg-gray-100 text-gray-700',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600',
      )}
    >
      {role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Invite modal
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['admin', 'manager', 'rep']),
})

type InviteFormValues = z.infer<typeof inviteSchema>

function TempPasswordBox({
  result,
  onClose,
}: {
  result: InviteResponse
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(result.temp_password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">{result.full_name}</span> ({result.email}
        ) has been invited as <span className="font-semibold">{result.role}</span>.
        Share this temporary password with them:
      </p>

      <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <code className="flex-1 text-sm font-mono text-amber-800 break-all">
          {result.temp_password}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
          title="Copy password"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        This password will not be shown again. Make sure to copy it now.
      </p>

      <button
        onClick={onClose}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Done
      </button>
    </div>
  )
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const inviteMember = useInviteMember()
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'rep' },
  })

  async function onSubmit(values: InviteFormValues) {
    try {
      const result = await inviteMember.mutateAsync(values)
      setInviteResult(result)
    } catch {
      toast.error('Failed to send invite')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {inviteResult ? 'Invitation Sent' : 'Invite Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {inviteResult ? (
          <TempPasswordBox result={inviteResult} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="colleague@company.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="rep">Rep</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

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
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team tab
// ---------------------------------------------------------------------------
function TeamTab() {
  const { data: team, isLoading, isError } = useTeam()
  const updateRole = useUpdateRole()
  const deactivateUser = useDeactivateUser()
  const [showInvite, setShowInvite] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null)

  async function handleDeactivate(id: string) {
    try {
      await deactivateUser.mutateAsync(id)
      toast.success('User deactivated')
    } catch {
      toast.error('Failed to deactivate user')
    } finally {
      setConfirmDeactivate(null)
    }
  }

  async function handleRoleChange(
    id: string,
    role: 'admin' | 'manager' | 'rep',
  ) {
    try {
      await updateRole.mutateAsync({ id, role })
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-gray-500">
        Failed to load team members. Please try again.
      </p>
    )
  }

  const members = team ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          + Invite Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No team members yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="py-3 pr-6 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((member: TeamMember) => (
                <tr
                  key={member.id}
                  className={clsx(
                    'hover:bg-gray-50 transition-colors',
                    !member.is_active && 'opacity-60',
                  )}
                >
                  <td
                    className={clsx(
                      'py-3 pl-6 pr-4 font-medium',
                      member.is_active ? 'text-gray-900' : 'text-gray-400',
                    )}
                  >
                    {member.full_name}
                  </td>
                  <td
                    className={clsx(
                      'py-3 pr-4',
                      member.is_active ? 'text-gray-600' : 'text-gray-400',
                    )}
                  >
                    {member.email}
                  </td>
                  <td className="py-3 pr-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="py-3 pr-4">
                    {member.is_active ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-6">
                    {member.is_active ? (
                      <div className="flex items-center gap-3">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as 'admin' | 'manager' | 'rep',
                            )
                          }
                          className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        >
                          <option value="rep">Rep</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>

                        {confirmDeactivate === member.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeactivate(member.id)}
                              className="text-xs text-red-600 font-medium hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeactivate(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeactivate(member.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
type TabId = 'profile' | 'team'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const tabs: Array<{ id: TabId; label: string; visible: boolean }> = [
    { id: 'profile', label: 'My Profile', visible: true },
    { id: 'team', label: 'Team', visible: isAdmin },
  ]

  const visibleTabs = tabs.filter((t) => t.visible)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-gray-100 flex">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-6 py-4 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'team' && isAdmin && <TeamTab />}
        </div>
      </div>
    </div>
  )
}
