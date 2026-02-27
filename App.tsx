import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { supabase } from './lib/supabase';
import {
  PRAYERS, PrayerType, Balance, Assignments, initBalance,
  todayISO, SLOTS, SlotKey, initAssignments,
} from './lib/prayers';
import { SettingsProvider } from './contexts/SettingsContext';
import HomeScreen from './screens/HomeScreen';
import PlannerScreen from './screens/PlannerScreen';
import SettingsScreen from './screens/SettingsScreen';
import SetupScreen from './screens/SetupScreen';

type Tab = 'home' | 'planner' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home',     icon: '🏠', label: 'Home'     },
  { id: 'planner',  icon: '📅', label: 'Plan'     },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function AppInner() {
  const [tab, setTab] = useState<Tab>('home');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [todayPlanned, setTodayPlanned] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadBalance(); loadTodayCount(); }, []);

  async function loadBalance() {
    const { data } = await supabase.from('qada_balance').select('*');
    if (data) {
      const bal = initBalance();
      data.forEach((r: any) => { bal[r.prayer_type as PrayerType] = r.remaining; });
      setBalance(bal);
    }
  }

  async function loadTodayCount() {
    const { data: plan } = await supabase
      .from('daily_plans')
      .select('id')
      .eq('plan_date', todayISO())
      .maybeSingle();
    if (plan?.id) {
      const { count } = await supabase
        .from('plan_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id);
      setTodayPlanned(count ?? 0);
    }
  }

  async function handleSaveBalance(newBalance: Balance) {
    const updates = PRAYERS.map(p => ({
      prayer_type: p,
      remaining: newBalance[p] ?? 0,
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(), ...newBalance, trigger_reason: 'manual_update',
    });
    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' });
    setBalance(newBalance);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Balance saved ✓');
    setTab('home');
  }

  function handleBalanceChange(newBalance: Balance) {
    setBalance(newBalance);
    loadTodayCount();
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function switchTab(t: Tab) {
    setTab(t);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (t === 'home') loadTodayCount();
  }

  // First-time setup
  if (balance === null) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingMoon}>🌙</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const hasBalance = PRAYERS.some(p => (balance[p] || 0) > 0);
  if (!hasBalance && tab !== 'settings') {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.setupHeader}>
            <Text style={styles.setupMoon}>🌙</Text>
            <Text style={styles.setupTitle}>Qada Tracker</Text>
          </View>
          <SetupScreen balance={balance} onSave={handleSaveBalance} isFirstTime />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        {/* Screen content */}
        <View style={{ flex: 1 }}>
          {tab === 'home' && (
            <HomeScreen balance={balance} todayPlanned={todayPlanned} />
          )}
          {tab === 'planner' && (
            <PlannerScreen balance={balance} onBalanceChange={handleBalanceChange} />
          )}
          {tab === 'settings' && (
            <SettingsScreen balance={balance} onSaveBalance={handleSaveBalance} />
          )}
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => switchTab(t.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{t.icon}</Text>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
                {active && <View style={styles.tabDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0f1e' },
  safe: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#0a0f1e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingMoon: { fontSize: 48 },
  loadingText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  setupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  setupMoon: { fontSize: 26 },
  setupTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,15,30,0.98)',
    paddingBottom: 4,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 20, opacity: 0.35 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.3)' },
  tabLabelActive: { color: '#a78bfa' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#a78bfa' },

  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
