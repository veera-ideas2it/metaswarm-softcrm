import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import type { DealListItem } from '../../types'
import { formatCurrency } from '../../utils/format'
import DealCard from './DealCard'

interface DraggableDealCardProps {
  deal: DealListItem
}

function DraggableDealCard({ deal }: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}

interface KanbanColumnProps {
  stage: string
  deals: DealListItem[]
  isOver?: boolean
}

function sumValues(deals: DealListItem[]): number {
  return deals.reduce((acc, d) => {
    if (d.value == null) return acc
    const n = typeof d.value === 'string' ? parseFloat(d.value) : d.value
    return acc + (isNaN(n) ? 0 : n)
  }, 0)
}

export default function KanbanColumn({ stage, deals, isOver = false }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: stage })
  const total = sumValues(deals)
  const currency = deals[0]?.currency ?? 'USD'

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-t-lg border border-b-0 border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-gray-700 truncate">{stage}</span>
          <span className="inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 flex-shrink-0">
            {deals.length}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0 ml-1">
            {formatCurrency(total, currency)}
          </span>
        )}
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={[
          'flex flex-col gap-2 p-2 rounded-b-lg border border-t-0 border-gray-200 min-h-[400px] transition-colors duration-150',
          isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50/60',
        ].join(' ')}
      >
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}

        {deals.length === 0 && (
          <div
            className={[
              'flex items-center justify-center h-20 rounded border-2 border-dashed text-xs text-gray-400',
              isOver ? 'border-blue-300 bg-blue-50 text-blue-400' : 'border-gray-200',
            ].join(' ')}
          >
            {isOver ? 'Drop here' : 'No deals'}
          </div>
        )}
      </div>
    </div>
  )
}
