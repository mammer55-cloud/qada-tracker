import { useDraggable } from '@dnd-kit/core'
import { PRAYERS, PRAYER_CONFIG } from '../lib/prayers'

function PaletteItem({ type, remaining, planned }) {
  const id = `palette::${type}`
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const c = PRAYER_CONFIG[type]
  const available = Math.max(0, remaining - planned)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        background: isDragging ? c.dimHex : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isDragging ? c.borderHex : 'rgba(255,255,255,0.09)'}`,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none',
        flexShrink: 0,
      }}
      className="flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl cursor-grab active:cursor-grabbing select-none transition-all duration-150"
    >
      <span className="text-xl">{c.icon}</span>
      <span className="text-xs font-semibold" style={{ color: c.hex }}>{c.name}</span>
      <span
        className="text-xs font-bold rounded-full px-1.5 min-w-[22px] text-center"
        style={{ background: remaining === 0 ? 'rgba(255,255,255,0.06)' : c.dimHex, color: remaining === 0 ? 'rgba(255,255,255,0.25)' : c.hex }}
      >
        {remaining}
      </span>
    </div>
  )
}

export default function PrayerPalette({ balance, plannedCounts }) {
  return (
    <div
      className="shrink-0 px-4 py-3 border-b"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}
    >
      <p className="text-xs mb-2.5 font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Drag to plan
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {PRAYERS.map(type => (
          <PaletteItem
            key={type}
            type={type}
            remaining={balance[type] || 0}
            planned={plannedCounts[type] || 0}
          />
        ))}
      </div>
    </div>
  )
}
