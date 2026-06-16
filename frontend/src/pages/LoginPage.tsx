import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { loginApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/pipeline'

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const result = await loginApi(values.email, values.password)
      setAuth(result.user, result.access_token)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Login failed. Please check your credentials.'
      setServerError(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-blue-600">SoftCRM</span>
          <p className="mt-2 text-gray-500 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
                  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.email
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300',
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
                  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  errors.password
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300',
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors',
                'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                isSubmitting && 'opacity-70 cursor-not-allowed',
              )}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
