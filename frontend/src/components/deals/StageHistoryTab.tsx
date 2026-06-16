import { useDealStageHistory } from '../../api/deals'
import { formatDate } from '../../utils/format'

interface StageHistoryTabProps {
  dealId: string
}

// ---------------------------------------------------------------------------
// Loading skeleton row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-28" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-12" /></td>
    </tr>
  )
}

export default function StageHistoryTab({ dealId }: StageHistoryTabProps) {
  const { data: history, isLoading, isError } = useDealStageHistory(dealId)

  return (
    <div className="py-4">
      {isError ? (
        <div className="text-center py-10 text-red-500 text-sm">
          Failed to load stage history.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  From Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  To Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Changed By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Days in Stage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : !history || history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No stage changes recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">
                      {entry.from_stage ?? (
                        <span className="text-gray-400 italic">Created</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                        {entry.to_stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{entry.changed_by_name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(entry.changed_at)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{entry.days_in_stage}d</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
