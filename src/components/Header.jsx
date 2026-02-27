import { todayLabel } from '../lib/prayers'

export default function Header({ view, onToggleSetup, completedToday }) {
  return (
    <header className="safe-top px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl">🌙</span>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Qada Tracker</h1>
          <p className="text-white/35 text-xs mt-0.5">{todayLabel()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {completedToday && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
            Done ✓
          </span>
        )}
        <button
          onClick={onToggleSetup}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: view === 'setup' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="text-base">{view === 'setup' ? '✕' : '⚙️'}</span>
        </button>
      </div>
    </header>
  )
}
