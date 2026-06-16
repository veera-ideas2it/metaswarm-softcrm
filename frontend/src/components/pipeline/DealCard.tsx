import { useNavigate } from 'react-router-dom'
import type { DealListItem } from '../../types'
import { formatCurrency } from '../../utils/format'

interface DealCardProps {
  deal: DealListItem
  isDragging?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function parseValue(value: DealListItem['value']): number | null {
  if (value == null) return null
  const n = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(n) ? null : n
}

export default function DealCard({ deal, isDragging = false }: DealCardProps) {
  const navigate = useNavigate()
  const numericValue = parseValue(deal.value)
  const isStale = deal.days_in_stage > 14

  function handleClick(e: React.MouseEvent) {
    // Skip navigation during drag (mousedown sets isDragging)
    if (isDragging) return
    e.stopPropagation()
    navigate(`/deals/${deal.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'bg-white rounded-lg border p-3 cursor-pointer select-none',
        'hover:shadow-md transition-shadow duration-150',
        isDragging
          ? 'shadow-xl opacity-90 rotate-1 border-blue-300'
          : 'border-gray-200 shadow-sm',
      ].join(' ')}
    >
      {/* Company name */}
      <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
        {deal.company_name ?? '—'}
      </p>

      {/* Deal title */}
      <p className="text-xs text-gray-500 mt-0.5 truncate">{deal.title}</p>

      {/* Value + owner row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Value badge */}
        {numericValue != null ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 truncate max-w-[120px]">
            {formatCurrency(numericValue, deal.currency)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">No value</span>
        )}

        {/* Owner avatar */}
        <div className="relative group flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium">
            {getInitials(deal.owner_name)}
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {deal.owner_name}
            </div>
          </div>
        </div>
      </div>

      {/* Days in stage + probability row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {/* Days in stage */}
        <span
          className={[
            'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
            isStale
              ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-300'
              : 'bg-gray-100 text-gray-600',
          ].join(' ')}
        >
          {deal.days_in_stage}d
        </span>

        {/* Probability */}
        {deal.probability != null && (
          <span className="text-xs text-gray-400">{deal.probability}%</span>
        )}
      </div>
    </div>
  )
}
