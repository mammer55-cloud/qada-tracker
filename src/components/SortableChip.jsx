import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PRAYER_CONFIG } from '../lib/prayers'

export default function SortableChip({ chip, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chip.id,
  })

  const c = PRAYER_CONFIG[chip.type]

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.25 : 1,
        background: c.dimHex,
        border: `1px solid ${c.borderHex}`,
        touchAction: 'none',
      }}
      className="flex items-center gap-1.5 rounded-full pl-2.5 pr-1.5 py-1 select-none cursor-grab active:cursor-grabbing shrink-0"
    >
      <span className="text-xs">{c.icon}</span>
      <span className="text-xs font-medium" style={{ color: c.hex }}>{c.name}</span>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onRemove(chip.id) }}
        className="w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors ml-0.5"
        style={{ fontSize: '10px' }}
      >
        ✕
      </button>
    </div>
  )
}
