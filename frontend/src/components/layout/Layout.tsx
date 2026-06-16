import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  Building2,
  Calendar,
  Kanban,
  LogOut,
  Settings,
  Users,
  Handshake,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { logoutApi } from '../../api/auth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/deals', label: 'Deals', icon: Handshake },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/activities', label: 'Activities', icon: Calendar },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logoutApi()
    } catch {
      // best-effort; clear locally regardless
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
      toast.success('Logged out')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col bg-white shadow-sm">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-blue-600">SoftCRM</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                {user?.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.full_name}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
