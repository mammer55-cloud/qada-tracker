import { useState } from 'react'
import { PRAYERS, PRAYER_CONFIG } from '../lib/prayers'

export default function SetupView({ balance, onSave, isFirstTime }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(PRAYERS.map(p => [p, balance[p] ?? 0]))
  )

  function set(prayer, raw) {
    const v = parseInt(raw, 10)
    setValues(prev => ({ ...prev, [prayer]: isNaN(v) || v < 0 ? 0 : v }))
  }

  const total = PRAYERS.reduce((s, p) => s + (values[p] || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-8">
      {isFirstTime && (
        <div className="mt-4 mb-6 rounded-2xl p-4 text-center" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
          <p className="text-2xl mb-2">🌙</p>
          <h2 className="text-white font-semibold text-lg">Welcome</h2>
          <p className="text-white/50 text-sm mt-1">Enter how many qada prayers you have remaining for each type to get started.</p>
        </div>
      )}

      {!isFirstTime && (
        <div className="mt-4 mb-5">
          <h2 className="text-white font-semibold text-base">Edit Balance</h2>
          <p className="text-white/40 text-sm">Update your remaining qada counts.</p>
        </div>
      )}

      <div className="space-y-3">
        {PRAYERS.map(prayer => {
          const c = PRAYER_CONFIG[prayer]
          return (
            <div
              key={prayer}
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: c.dimHex, border: `1px solid ${c.borderHex}` }}
            >
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1">
                <p className="text-white font-semibold">{c.name}</p>
                <p className="text-white/40 text-xs">{c.arabic} · {c.time}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => set(prayer, Math.max(0, (values[prayer] || 0) - 1))}
                  className="w-9 h-9 rounded-xl text-lg font-bold flex items-center justify-center active:scale-90 transition-transform select-none"
                  style={{ background: 'rgba(255,255,255,0.08)', color: c.hex }}
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={values[prayer]}
                  onChange={e => set(prayer, e.target.value)}
                  className="w-16 text-center text-white font-bold text-lg rounded-xl py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${c.borderHex}` }}
                  min="0"
                />
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => set(prayer, (values[prayer] || 0) + 1)}
                  className="w-9 h-9 rounded-xl text-lg font-bold flex items-center justify-center active:scale-90 transition-transform select-none"
                  style={{ background: 'rgba(255,255,255,0.08)', color: c.hex }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-2xl p-4 flex items-center justify-between glass">
        <div>
          <p className="text-white/40 text-xs">Total remaining</p>
          <p className="text-white font-bold text-2xl">{total.toLocaleString()}</p>
        </div>
        <p className="text-white/30 text-sm">prayers</p>
      </div>

      <button
        onClick={() => onSave(values)}
        className="mt-4 w-full py-4 rounded-2xl font-semibold text-white text-base active:scale-98 transition-transform"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
      >
        {isFirstTime ? 'Start Tracking' : 'Save Balance'}
      </button>
    </div>
  )
}
