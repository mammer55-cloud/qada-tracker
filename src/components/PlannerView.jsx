import { useState, useMemo, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PRAYERS, PRAYER_CONFIG, SLOTS } from '../lib/prayers'
import PrayerPalette from './PrayerPalette'
import FardPrayerSection from './FardPrayerSection'
import BalanceSummary from './BalanceSummary'

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
}

export default function PlannerView({ balance, assignments, onAssignmentsChange, onCompleteDay, completedToday }) {
  const [activeChip, setActiveChip] = useState(null) // { id, type } | null
  const assignmentsRef = useRef(assignments)
  assignmentsRef.current = assignments

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Find which slot contains itemId, using latest ref
  const findSlot = useCallback((itemId) => {
    if (SLOTS.includes(itemId)) return itemId
    for (const [slotId, chips] of Object.entries(assignmentsRef.current)) {
      if (chips.some(c => c.id === itemId)) return slotId
    }
    return null
  }, [])

  function handleDragStart({ active }) {
    if (String(active.id).startsWith('palette::')) {
      const type = String(active.id).split('::')[1]
      setActiveChip({ id: active.id, type })
    } else {
      // Find chip in assignments
      for (const chips of Object.values(assignmentsRef.current)) {
        const chip = chips.find(c => c.id === active.id)
        if (chip) { setActiveChip(chip); break }
      }
    }
  }

  function handleDragOver({ active, over }) {
    if (!over) return
    const activeId = String(active.id)
    if (activeId.startsWith('palette::')) return // palette drags handled in dragEnd only

    const sourceSlot = findSlot(activeId)
    const targetSlot = findSlot(over.id)
    if (!sourceSlot || !targetSlot || sourceSlot === targetSlot) return

    onAssignmentsChange(
      (() => {
        const next = {}
        SLOTS.forEach(k => { next[k] = [...(assignmentsRef.current[k] || [])] })
        const chip = next[sourceSlot].find(c => c.id === activeId)
        if (!chip) return assignmentsRef.current
        next[sourceSlot] = next[sourceSlot].filter(c => c.id !== activeId)
        const overIdx = next[targetSlot].findIndex(c => c.id === over.id)
        const insertAt = overIdx >= 0 ? overIdx : next[targetSlot].length
        next[targetSlot] = [...next[targetSlot].slice(0, insertAt), chip, ...next[targetSlot].slice(insertAt)]
        return next
      })()
    )
  }

  function handleDragEnd({ active, over }) {
    setActiveChip(null)
    if (!over) return

    const activeId = String(active.id)
    const targetSlot = findSlot(over.id)
    if (!targetSlot) return

    if (activeId.startsWith('palette::')) {
      const type = activeId.split('::')[1]
      const newChip = { id: crypto.randomUUID(), type }
      const next = { ...assignmentsRef.current }
      next[targetSlot] = [...(next[targetSlot] || []), newChip]
      onAssignmentsChange(next)
    } else {
      // Reorder within same container
      const sourceSlot = findSlot(activeId)
      if (sourceSlot && sourceSlot === targetSlot) {
        const items = assignmentsRef.current[sourceSlot]
        const oldIdx = items.findIndex(c => c.id === activeId)
        const newIdx = items.findIndex(c => c.id === over.id)
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const next = { ...assignmentsRef.current }
          next[sourceSlot] = arrayMove(items, oldIdx, newIdx)
          onAssignmentsChange(next)
        }
      }
    }
  }

  function removeChip(chipId) {
    const next = {}
    SLOTS.forEach(k => { next[k] = (assignmentsRef.current[k] || []).filter(c => c.id !== chipId) })
    onAssignmentsChange(next)
  }

  const plannedCounts = useMemo(() => {
    const counts = {}
    PRAYERS.forEach(p => { counts[p] = 0 })
    SLOTS.forEach(slotKey => {
      ;(assignments[slotKey] || []).forEach(chip => { counts[chip.type] = (counts[chip.type] || 0) + 1 })
    })
    return counts
  }, [assignments])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <PrayerPalette balance={balance} plannedCounts={plannedCounts} />

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
          {completedToday && (
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <p className="text-2xl mb-1">✨</p>
              <p className="text-white font-semibold text-sm">Today's plan is complete!</p>
              <p className="text-white/40 text-xs mt-0.5">Come back tomorrow, insha'Allah.</p>
            </div>
          )}

          {PRAYERS.map(prayer => (
            <FardPrayerSection
              key={prayer}
              prayer={prayer}
              assignments={assignments}
              onRemove={removeChip}
            />
          ))}

          <div className="h-4" />
        </div>

        <BalanceSummary
          balance={balance}
          plannedCounts={plannedCounts}
          onCompleteDay={() => onCompleteDay(plannedCounts)}
          completedToday={completedToday}
        />
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeChip && (() => {
          const c = PRAYER_CONFIG[activeChip.type]
          return (
            <div
              className="flex items-center gap-1.5 rounded-full pl-3 pr-3 py-1.5 shadow-2xl font-medium text-xs"
              style={{ background: c.hex, color: '#0a0f1e', boxShadow: `0 8px 32px ${c.hex}66` }}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </div>
          )
        })()}
      </DragOverlay>
    </DndContext>
  )
}
