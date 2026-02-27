import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { supabase } from './lib/supabase';
import {
  PRAYERS, PrayerType, Balance, Assignments, initAssignments, initBalance,
  todayISO, todayLabel, SLOTS, SlotKey,
} from './lib/prayers';
import SetupScreen from './screens/SetupScreen';
import PlannerScreen from './screens/PlannerScreen';

type Screen = 'planner' | 'setup';

export default function App() {
  const [screen, setScreen] = useState<Screen>('planner');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [assignments, setAssignments] = useState<Assignments>(initAssignments());
  const [planId, setPlanId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: balRows }, { data: plan }] = await Promise.all([
      supabase.from('qada_balance').select('*'),
      supabase.from('daily_plans').select('*, plan_assignments(*)').eq('plan_date', todayISO()).maybeSingle(),
    ]);

    if (balRows) {
      const bal = initBalance();
      balRows.forEach((r: any) => { bal[r.prayer_type as PrayerType] = r.remaining; });
      setBalance(bal);
    }

    if (plan) {
      setPlanId(plan.id);
      setCompletedToday(plan.is_completed);
      const map = initAssignments();
      (plan.plan_assignments || []).forEach((a: any) => {
        const key: SlotKey = `${a.fard_prayer}::${a.slot}`;
        if (map[key]) map[key].push({ id: a.id, type: a.qada_prayer_type as PrayerType, orderIndex: a.order_index });
      });
      SLOTS.forEach(k => { map[k].sort((a: any, b: any) => a.orderIndex - b.orderIndex); });
      setAssignments(map);
    }
  }

  function scheduleSave(newAssignments: Assignments) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => savePlan(newAssignments), 900);
  }

  async function savePlan(current: Assignments) {
    let pid = planId;
    if (!pid) {
      const { data } = await supabase
        .from('daily_plans')
        .upsert({ plan_date: todayISO() }, { onConflict: 'plan_date' })
        .select('id').single();
      if (!data) return;
      pid = data.id;
      setPlanId(pid);
    }
    await supabase.from('plan_assignments').delete().eq('plan_id', pid);
    const rows: any[] = [];
    SLOTS.forEach(slotKey => {
      const [fardPrayer, slot] = slotKey.split('::');
      (current[slotKey] || []).forEach((chip, idx) => {
        rows.push({ plan_id: pid, fard_prayer: fardPrayer, slot, qada_prayer_type: chip.type, order_index: idx });
      });
    });
    if (rows.length) await supabase.from('plan_assignments').insert(rows);
  }

  function handleAssignmentsChange(newAssignments: Assignments) {
    setAssignments(newAssignments);
    scheduleSave(newAssignments);
  }

  async function handleSaveBalance(newBalance: Balance) {
    const updates = PRAYERS.map(p => ({
      prayer_type: p, remaining: newBalance[p] ?? 0, updated_at: new Date().toISOString(),
    }));
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(), ...newBalance, trigger_reason: 'manual_update',
    });
    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' });
    setBalance(newBalance);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Balance saved ✓');
    setScreen('planner');
  }

  async function handleCompleteDay(plannedCounts: Record<PrayerType, number>) {
    if (!balance) return;
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(), ...balance, trigger_reason: 'pre_complete',
    });
    const newBalance = { ...balance };
    const updates = PRAYERS.map(p => {
      const completed = Math.min(plannedCounts[p] || 0, balance[p] || 0);
      newBalance[p] = (balance[p] || 0) - completed;
      return { prayer_type: p, remaining: newBalance[p], updated_at: new Date().toISOString() };
    });
    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' });
    await supabase.from('balance_snapshots').insert({
      snapshot_date: todayISO(), ...newBalance, trigger_reason: 'post_complete',
    });
    if (planId) await supabase.from('daily_plans').update({ is_completed: true }).eq('id', planId);
    setBalance(newBalance);
    setCompletedToday(true);
    const total = PRAYERS.reduce((s, p) => s + (plannedCounts[p] || 0), 0);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`Masha'Allah! ${total} qada completed ✓`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Loading
  if (!balance) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingMoon}>🌙</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const hasBalance = PRAYERS.some(p => (balance[p] || 0) > 0);
  const showSetup = screen === 'setup' || !hasBalance;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerMoon}>🌙</Text>
            <View>
              <Text style={styles.headerTitle}>Qada Tracker</Text>
              <Text style={styles.headerDate}>{todayLabel()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {completedToday && (
              <View style={styles.donePill}>
                <Text style={styles.donePillText}>Done ✓</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setScreen(screen === 'setup' ? 'planner' : 'setup')}
              style={[styles.gearBtn, screen === 'setup' && styles.gearBtnActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.gearIcon}>{screen === 'setup' ? '✕' : '⚙️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {showSetup ? (
            <SetupScreen
              balance={balance}
              onSave={handleSaveBalance}
              isFirstTime={!hasBalance}
            />
          ) : (
            <PlannerScreen
              balance={balance}
              assignments={assignments}
              completedToday={completedToday}
              onAssignmentsChange={handleAssignmentsChange}
              onCompleteDay={handleCompleteDay}
            />
          )}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  safe: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: '#0a0f1e',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingMoon: { fontSize: 48 },
  loadingText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerMoon: { fontSize: 26 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerDate: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donePill: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  donePillText: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },
  gearBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  gearBtnActive: { backgroundColor: 'rgba(167,139,250,0.2)' },
  gearIcon: { fontSize: 16 },
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,0.95)',
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
