import { PRAYERS, PRAYER_CONFIG } from '../lib/prayers'

export default function BalanceSummary({ balance, plannedCounts, onCompleteDay, completedToday }) {
  const totalRemaining = PRAYERS.reduce((s, p) => s + (balance[p] || 0), 0)
  const totalPlanned = PRAYERS.reduce((s, p) => s + (plannedCounts[p] || 0), 0)

  return (
    <div
      className="safe-bottom rounded-t-3xl px-4 pt-4 pb-4"
      style={{ background: 'rgba(10,15,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
    >
      {/* Mini balance row */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {PRAYERS.map(p => {
          const c = PRAYER_CONFIG[p]
          const rem = balance[p] || 0
          const planned = plannedCounts[p] || 0
          return (
            <div
              key={p}
              className="flex flex-col items-center gap-0.5 shrink-0 flex-1"
              style={{ minWidth: 48 }}
            >
              <span className="text-base">{c.icon}</span>
              <span className="text-xs font-bold" style={{ color: rem === 0 ? 'rgba(255,255,255,0.2)' : c.hex }}>{rem}</span>
              {planned > 0 && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>-{planned}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-white/35 text-xs">Total remaining</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-bold text-xl">{totalRemaining.toLocaleString()}</span>
            {totalPlanned > 0 && (
              <span className="text-white/40 text-sm">→ {Math.max(0, totalRemaining - totalPlanned).toLocaleString()}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => !completedToday && totalPlanned > 0 && onCompleteDay()}
          disabled={completedToday || totalPlanned === 0}
          className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{
            background: completedToday
              ? 'rgba(167,139,250,0.15)'
              : totalPlanned > 0
              ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
              : 'rgba(255,255,255,0.06)',
            color: completedToday ? '#a78bfa' : 'white',
            border: completedToday ? '1px solid rgba(167,139,250,0.3)' : 'none',
          }}
        >
          {completedToday ? 'Done ✓' : totalPlanned === 0 ? 'Plan first' : `Complete ${totalPlanned}`}
        </button>
      </div>
    </div>
  )
}
