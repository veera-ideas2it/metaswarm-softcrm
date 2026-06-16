import { useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { useDashboard } from '../api/dashboard'
import type { RecentActivity } from '../api/dashboard'
import KPICard from '../components/ui/KPICard'
import {
  KPICardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  ActivityFeedSkeleton,
} from '../components/ui/LoadingSkeleton'

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Activity icons
// ---------------------------------------------------------------------------
const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  note: '📝',
  task: '✅',
}

function activityIcon(type: string): string {
  return ACTIVITY_ICONS[type] ?? '📌'
}

// ---------------------------------------------------------------------------
// KPI icon components (simple inline SVG)
// ---------------------------------------------------------------------------
function PipelineIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}

function ChartBarIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Activity feed item
// ---------------------------------------------------------------------------
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const navigate = useNavigate()

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm"
        title={activity.type}
      >
        {activityIcon(activity.type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 truncate">
          {activity.subject}{' '}
          {activity.deal_id && (
            <button
              onClick={() => navigate(`/deals/${activity.deal_id}`)}
              className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium focus:outline-none"
            >
              View deal
            </button>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {activity.user.full_name} &middot;{' '}
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard()

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Failed to load dashboard data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : (
          <>
            <KPICard
              icon={<PipelineIcon />}
              label="Pipeline Value"
              value={formatCurrency(data!.total_pipeline_value)}
            />
            <KPICard
              icon={<TrophyIcon />}
              label="Won This Month"
              value={formatCurrency(data!.deals_won_this_month.value)}
              subValue={`${data!.deals_won_this_month.count} deal${data!.deals_won_this_month.count !== 1 ? 's' : ''}`}
            />
            <KPICard
              icon={<ChartBarIcon />}
              label="Win Rate"
              value={formatPercent(data!.win_rate_percent)}
              subValue="Last 90 days"
            />
            <KPICard
              icon={<TrendingUpIcon />}
              label="Avg Deal Size"
              value={formatCurrency(data!.avg_deal_size)}
              subValue="Last 90 days"
            />
          </>
        )}
      </div>

      {/* Chart + Closing Soon side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage Chart */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Pipeline by Stage
            </h2>
            {data!.pipeline_by_stage.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No open deals in pipeline
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data!.pipeline_by_stage}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, 'Deals']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Closing Soon Table */}
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Closing Soon
              <span className="ml-2 text-xs font-normal text-gray-400">
                (next 14 days)
              </span>
            </h2>
            {data!.deals_closing_soon.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No deals closing in the next 14 days
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-3 font-medium text-gray-500 whitespace-nowrap">
                        Deal
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-gray-500 whitespace-nowrap">
                        Company
                      </th>
                      <th className="text-right py-2 pr-3 font-medium text-gray-500 whitespace-nowrap">
                        Value
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-gray-500 whitespace-nowrap">
                        Close Date
                      </th>
                      <th className="text-left py-2 font-medium text-gray-500 whitespace-nowrap">
                        Owner
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.deals_closing_soon.map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2.5 pr-3 font-medium text-gray-900 truncate max-w-[140px]">
                          {deal.title}
                        </td>
                        <td className="py-2.5 pr-3 text-gray-600 truncate max-w-[120px]">
                          {deal.company}
                        </td>
                        <td className="py-2.5 pr-3 text-right text-gray-700 whitespace-nowrap">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">
                          {formatDate(deal.expected_close_date)}
                        </td>
                        <td className="py-2.5 text-gray-600 truncate max-w-[100px]">
                          {deal.owner}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {isLoading ? (
        <ActivityFeedSkeleton rows={6} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-2">
            Recent Activity
          </h2>
          {data!.recent_activities.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
              No recent activity
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {data!.recent_activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
