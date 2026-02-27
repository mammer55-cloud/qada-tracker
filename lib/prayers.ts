export type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type SlotPosition = 'before' | 'after';

export const PRAYERS: PrayerType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface PrayerConfig {
  name: string;
  arabic: string;
  icon: string;
  time: string;
  hex: string;
  dimHex: string;
  borderHex: string;
}

export const PRAYER_CONFIG: Record<PrayerType, PrayerConfig> = {
  fajr:    { name: 'Fajr',    arabic: 'الفجر', icon: '🌅', time: 'Dawn',      hex: '#60a5fa', dimHex: 'rgba(96,165,250,0.15)',  borderHex: 'rgba(96,165,250,0.35)'  },
  dhuhr:   { name: 'Dhuhr',   arabic: 'الظهر', icon: '☀️', time: 'Noon',      hex: '#fbbf24', dimHex: 'rgba(251,191,36,0.15)',  borderHex: 'rgba(251,191,36,0.35)'  },
  asr:     { name: 'Asr',     arabic: 'العصر', icon: '🌤', time: 'Afternoon', hex: '#fb923c', dimHex: 'rgba(251,146,60,0.15)',  borderHex: 'rgba(251,146,60,0.35)'  },
  maghrib: { name: 'Maghrib', arabic: 'المغرب',icon: '🌇', time: 'Sunset',    hex: '#f472b6', dimHex: 'rgba(244,114,182,0.15)',borderHex: 'rgba(244,114,182,0.35)' },
  isha:    { name: 'Isha',    arabic: 'العشاء',icon: '🌙', time: 'Night',     hex: '#a78bfa', dimHex: 'rgba(167,139,250,0.15)',borderHex: 'rgba(167,139,250,0.35)' },
};

export type SlotKey = string; // `${PrayerType}::${SlotPosition}`
export const SLOTS: SlotKey[] = PRAYERS.flatMap(p => [`${p}::before`, `${p}::after`]);

export interface ChipItem { id: string; type: PrayerType; orderIndex?: number; }
export type Assignments = Record<SlotKey, ChipItem[]>;

export const initAssignments = (): Assignments =>
  Object.fromEntries(SLOTS.map(s => [s, []])) as Assignments;

export const todayISO = () => new Date().toISOString().split('T')[0];

export const todayLabel = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export type Balance = Record<PrayerType, number>;
export const initBalance = (): Balance => ({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 });
