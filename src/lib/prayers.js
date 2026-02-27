export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_CONFIG = {
  fajr: {
    name: 'Fajr',
    arabic: 'الفجر',
    icon: '🌅',
    time: 'Dawn',
    hex: '#60a5fa',
    dimHex: 'rgba(96,165,250,0.15)',
    borderHex: 'rgba(96,165,250,0.35)',
  },
  dhuhr: {
    name: 'Dhuhr',
    arabic: 'الظهر',
    icon: '☀️',
    time: 'Noon',
    hex: '#fbbf24',
    dimHex: 'rgba(251,191,36,0.15)',
    borderHex: 'rgba(251,191,36,0.35)',
  },
  asr: {
    name: 'Asr',
    arabic: 'العصر',
    icon: '🌤️',
    time: 'Afternoon',
    hex: '#fb923c',
    dimHex: 'rgba(251,146,60,0.15)',
    borderHex: 'rgba(251,146,60,0.35)',
  },
  maghrib: {
    name: 'Maghrib',
    arabic: 'المغرب',
    icon: '🌇',
    time: 'Sunset',
    hex: '#f472b6',
    dimHex: 'rgba(244,114,182,0.15)',
    borderHex: 'rgba(244,114,182,0.35)',
  },
  isha: {
    name: 'Isha',
    arabic: 'العشاء',
    icon: '🌙',
    time: 'Night',
    hex: '#a78bfa',
    dimHex: 'rgba(167,139,250,0.15)',
    borderHex: 'rgba(167,139,250,0.35)',
  },
}

export const SLOTS = PRAYERS.flatMap(p => [`${p}::before`, `${p}::after`])

export const initAssignments = () =>
  Object.fromEntries(SLOTS.map(s => [s, []]))

export const todayISO = () => new Date().toISOString().split('T')[0]

export const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
