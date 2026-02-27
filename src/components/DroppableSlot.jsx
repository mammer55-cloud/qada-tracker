import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import SortableChip from './SortableChip'

export default function DroppableSlot({ id, chips, onRemove, label }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  const isEmpty = chips.length === 0

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 44,
        background: isOver ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: isEmpty
          ? `1px dashed ${isOver ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`
          : '1px solid transparent',
        transition: 'all 0.15s ease',
      }}
      className="flex flex-wrap gap-1.5 p-2 rounded-xl"
    >
      <SortableContext items={chips.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        {chips.map(chip => (
          <SortableChip key={chip.id} chip={chip} onRemove={onRemove} />
        ))}
      </SortableContext>
      {isEmpty && (
        <span className="text-xs self-center w-full text-center" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {isOver ? 'drop here' : `drag qada {label}`}
        </span>
      )}
    </div>
  )
}
