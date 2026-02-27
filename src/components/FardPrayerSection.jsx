import { PRAYER_CONFIG } from '../lib/prayers'
import DroppableSlot from './DroppableSlot'

export default function FardPrayerSection({ prayer, assignments, onRemove }) {
  const c = PRAYER_CONFIG[prayer]
  const beforeKey = `${prayer}::before`
  const afterKey = `${prayer}::after`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Before slot */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Before
        </span>
        <DroppableSlot
          id={beforeKey}
          chips={assignments[beforeKey] || []}
          onRemove={onRemove}
          label="before"
        />
      </div>

      {/* Fard divider */}
      <div
        className="mx-3 my-1 rounded-xl px-3 py-2.5 flex items-center gap-3"
        style={{ background: `linear-gradient(90deg, ${c.dimHex}, rgba(255,255,255,0.02))`, border: `1px solid ${c.borderHex}` }}
      >
        <span className="text-xl">{c.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{c.name}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.arabic}</p>
        </div>
        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.time}</span>
      </div>

      {/* After slot */}
      <div className="px-3 pb-3 pt-1">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          After
        </span>
        <DroppableSlot
          id={afterKey}
          chips={assignments[afterKey] || []}
          onRemove={onRemove}
          label="after"
        />
      </div>
    </div>
  )
}
