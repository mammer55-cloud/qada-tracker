import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  dailyCommitment: number;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
}

const DEFAULTS: AppSettings = {
  dailyCommitment: 5,
  notificationsEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
};

const KEY = '@qada_settings_v1';

interface CtxValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  loaded: boolean;
}

const SettingsContext = createContext<CtxValue>({
  settings: DEFAULTS,
  updateSettings: async () => {},
  loaded: false,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) {
        try { setSettings({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  async function updateSettings(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}
