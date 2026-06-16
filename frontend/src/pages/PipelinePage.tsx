import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useDeals, useUpdateDealStage } from '../api/deals'
import type { DealListItem } from '../types'
import KanbanColumn from '../components/pipeline/KanbanColumn'
import DealCard from '../components/pipeline/DealCard'
import AddDealSlideOver from '../components/pipeline/AddDealSlideOver'

// Backend stage list (the 12 stages the API knows about)
const PIPELINE_STAGES = [
  'Lead',
  'MQL',
  'Discovery Call',
  'Demo Scheduled',
  'Demo Done',
  'Technical Validation',
  'Security Review',
  'Proposal Sent',
  'Negotiation',
  'Contract Sent',
  'Won',
  'Lost',
]

function groupByStage(deals: DealListItem[]): Record<string, DealListItem[]> {
  const map: Record<string, DealListItem[]> = {}
  for (const stage of PIPELINE_STAGES) {
    map[stage] = []
  }
  for (const deal of deals) {
    if (map[deal.stage]) {
      map[deal.stage].push(deal)
    } else {
      // Unexpected stage — put in Lead column
      map['Lead'].push(deal)
    }
  }
  return map
}

export default function PipelinePage() {
  const user = useAuthStore((s) => s.user)
  const isRep = user?.role === 'rep'
  const canPickOwner = user?.role === 'admin' || user?.role === 'manager'

  // Filters
  const [myDeals, setMyDeals] = useState(isRep)
  const [ownerId, setOwnerId] = useState<string | null>(isRep ? (user?.id ?? null) : null)
  const [dealType, setDealType] = useState<string | null>(null)

  // UI state
  const [addOpen, setAddOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  // Local optimistic deals map
  const [localDealsMap, setLocalDealsMap] = useState<Record<string, DealListItem[]> | null>(null)

  // Query
  const params = {
    owner_id: myDeals ? (user?.id ?? null) : ownerId,
    deal_type: dealType,
    per_page: 200,
  }
  const { data, isLoading, refetch } = useDeals(params)

  const updateStage = useUpdateDealStage()

  // Derived: use local map if optimistic update in-flight, else server data
  const dealsMap: Record<string, DealListItem[]> = localDealsMap ??
    groupByStage(data?.data ?? [])

  // dnd-kit sensors — require a 5px movement before drag starts so clicks work
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  // Find the dragged deal for DragOverlay
  const activeDeal = activeId
    ? Object.values(dealsMap).flat().find((d) => d.id === activeId) ?? null
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: { over: { id: string } | null }) {
    setOverStage(event.over ? String(event.over.id) : null)
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null)
      setOverStage(null)

      const { active, over } = event
      if (!over) return

      const dealId = String(active.id)
      const newStage = String(over.id)

      // Find current stage
      let fromStage: string | null = null
      for (const [stage, deals] of Object.entries(dealsMap)) {
        if (deals.some((d) => d.id === dealId)) {
          fromStage = stage
          break
        }
      }
      if (!fromStage || fromStage === newStage) return

      // Build optimistic state
      const snapshot = { ...dealsMap }
      const deal = dealsMap[fromStage].find((d) => d.id === dealId)!
      const optimistic: Record<string, DealListItem[]> = {}
      for (const stage of PIPELINE_STAGES) {
        optimistic[stage] = [...(dealsMap[stage] ?? [])]
      }
      optimistic[fromStage] = optimistic[fromStage].filter((d) => d.id !== dealId)
      optimistic[newStage] = [...optimistic[newStage], { ...deal, stage: newStage }]
      setLocalDealsMap(optimistic)

      try {
        await updateStage.mutateAsync({ id: dealId, stage: newStage })
        // Let server response drive the final state
        setLocalDealsMap(null)
        refetch()
      } catch {
        // Revert
        setLocalDealsMap(snapshot)
        toast.error('Failed to move deal. Please try again.')
      }
    },
    [dealsMap, updateStage, refetch],
  )

  function handleMyDealsToggle(toMy: boolean) {
    if (isRep) return // reps are always locked to My Deals
    setMyDeals(toMy)
    setOwnerId(toMy ? (user?.id ?? null) : null)
    setLocalDealsMap(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deal
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100">
        {/* My Deals / All Deals toggle */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => handleMyDealsToggle(true)}
            disabled={isRep}
            className={[
              'px-3 py-1.5 font-medium transition-colors',
              myDeals
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            My Deals
          </button>
          <button
            onClick={() => handleMyDealsToggle(false)}
            disabled={isRep}
            className={[
              'px-3 py-1.5 font-medium transition-colors',
              !myDeals
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            All Deals
          </button>
        </div>

        {/* Owner select — manager/admin only */}
        {canPickOwner && !myDeals && (
          <div>
            <label className="sr-only">Owner</label>
            <input
              type="text"
              placeholder="Filter by owner ID..."
              value={ownerId ?? ''}
              onChange={(e) => {
                setOwnerId(e.target.value || null)
                setLocalDealsMap(null)
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>
        )}

        {/* Deal type filter */}
        <select
          value={dealType ?? ''}
          onChange={(e) => {
            setDealType(e.target.value || null)
            setLocalDealsMap(null)
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="new_business">New Business</option>
          <option value="expansion">Expansion</option>
          <option value="renewal">Renewal</option>
        </select>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        {isLoading ? (
          <div className="flex gap-4">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage}
                className="min-w-[280px] max-w-[280px] h-64 rounded-lg bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver as never}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4">
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  deals={dealsMap[stage] ?? []}
                  isOver={overStage === stage}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDeal ? (
                <div className="w-[264px]">
                  <DealCard deal={activeDeal} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Add Deal slide-over */}
      <AddDealSlideOver
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setLocalDealsMap(null)
          refetch()
        }}
      />
    </div>
  )
}
