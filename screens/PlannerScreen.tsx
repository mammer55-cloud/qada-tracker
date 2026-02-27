import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DragProvider, useDrag } from '../contexts/DragContext';
import {
  PRAYERS, PrayerType, SlotKey, Assignments, Balance,
  initAssignments, todayISO, SLOTS, ChipItem,
} from '../lib/prayers';
import { supabase } from '../lib/supabase';
import PrayerPalette from '../components/PrayerPalette';
import FardPrayerSection from '../components/FardPrayerSection';
import BalanceSummary from '../components/BalanceSummary';

// ── date helpers ──────────────────────────────────────────────────────────────
function offsetDate(base: string, days: number): string {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function dayLabel(iso: string): string {
  const today = todayISO();
  const diff = Math.round(
    (new Date(iso + 'T12:00:00Z').getTime() - new Date(today + 'T12:00:00Z').getTime()) /
    86400000,
  );
  if (diff === -1) return 'Yesterday';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isPast(iso: string) { return iso < todayISO(); }
function isFuture(iso: string) { return iso > todayISO(); }

// ── inner planner (needs DragContext) ─────────────────────────────────────────
interface InnerProps {
  balance: Balance;
  activeDate: string;
  assignments: Assignments;
  planCompleted: boolean;
  loading: boolean;
  onRemove: (id: string) => void;
  onCompleteDay: () => void;
}

function PlannerInner({ balance, activeDate, assignments, planCompleted, loading, onRemove, onCompleteDay }: InnerProps) {
  const { isDragging } = useDrag();

  return (
    <View style={{ flex: 1 }}>
      <PrayerPalette balance={balance} assignments={assignments} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="rgba(255,255,255,0.3)" />
          </View>
        )}

        {!loading && planCompleted && (
          <View style={styles.doneBanner}>
            <Text style={styles.doneIcon}>✨</Text>
            <Text style={styles.doneTitle}>
              {isPast(activeDate) ? 'This day is complete.' : "Today's plan is complete!"}
            </Text>
            <Text style={styles.doneSub}>Come back tomorrow, insha'Allah.</Text>
          </View>
        )}

        {!loading && PRAYERS.map(prayer => (
          <FardPrayerSection
            key={prayer}
            prayer={prayer}
            assignments={assignments}
            onRemove={onRemove}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <BalanceSummary
        balance={balance}
        assignments={assignments}
        completedToday={planCompleted || isFuture(activeDate)}
        onCompleteDay={onCompleteDay}
        isFuture={isFuture(activeDate)}
      />
    </View>
  );
}

// ── main export ───────────────────────────────────────────────────────────────
interface Props {
  balance: Balance;
  onBalanceChange: (b: Balance) => void;
}

export default function PlannerScreen({ balance, onBalanceChange }: Props) {
  const [activeDate, setActiveDate] = useState(todayISO());
  const [assignments, setAssignments] = useState<Assignments>(initAssignments());
  const [planId, setPlanId] = useState<string | null>(null);
  const [planCompleted, setPlanCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;

  useEffect(() => { loadPlan(activeDate); }, [activeDate]);

  async function loadPlan(date: string) {
    setLoading(true);
    setAssignments(initAssignments());
    setPlanId(null);
    setPlanCompleted(false);

    const { data } = await supabase
      .from('daily_plans')
      .select('*, plan_assignments(*)')
      .eq('plan_date', date)
      .maybeSingle();

    if (data) {
      setPlanId(data.id);
      setPlanCompleted(data.is_completed);
      const map = initAssignments();
      (data.plan_assignments || []).forEach((a: any) => {
        const key: SlotKey = `${a.fard_prayer}::${a.slot}`;
        if (map[key]) map[key].push({ id: a.id, type: a.qada_prayer_type as PrayerType, orderIndex: a.order_index });
      });
      SLOTS.forEach(k => { map[k].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); });
      setAssignments(map);
    }
    setLoading(false);
  }

  function scheduleSave(next: Assignments) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => savePlan(next, activeDate), 900);
  }

  async function savePlan(current: Assignments, date: string) {
    let pid = planId;
    if (!pid) {
      const { data } = await supabase
        .from('daily_plans')
        .upsert({ plan_date: date }, { onConflict: 'plan_date' })
        .select('id')
        .single();
      if (!data) return;
      pid = data.id;
      setPlanId(pid);
    }
    await supabase.from('plan_assignments').delete().eq('plan_id', pid);
    const rows: object[] = [];
    SLOTS.forEach(slotKey => {
      const [fardPrayer, slot] = slotKey.split('::');
      (current[slotKey] || []).forEach((chip: ChipItem, idx: number) => {
        rows.push({ plan_id: pid, fard_prayer: fardPrayer, slot, qada_prayer_type: chip.type, order_index: idx });
      });
    });
    if (rows.length) await supabase.from('plan_assignments').insert(rows);
  }

  function handleAssignmentsChange(next: Assignments) {
    setAssignments(next);
    scheduleSave(next);
  }

  const handleDrop = useCallback((type: PrayerType, slotId: SlotKey) => {
    const newChip: ChipItem = { id: Math.random().toString(36).slice(2), type };
    const next: Assignments = {} as Assignments;
    Object.keys(assignmentsRef.current).forEach(k => {
      next[k as SlotKey] = [...assignmentsRef.current[k as SlotKey]];
    });
    next[slotId] = [...next[slotId], newChip];
    handleAssignmentsChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const removeChip = useCallback((chipId: string) => {
    const next: Assignments = {} as Assignments;
    Object.keys(assignmentsRef.current).forEach(k => {
      next[k as SlotKey] = assignmentsRef.current[k as SlotKey].filter((c: ChipItem) => c.id !== chipId);
    });
    handleAssignmentsChange(next);
  }, []);

  async function handleCompleteDay() {
    const plannedCounts: Record<PrayerType, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    Object.values(assignmentsRef.current).forEach(chips =>
      chips.forEach((chip: ChipItem) => { plannedCounts[chip.type] = (plannedCounts[chip.type] || 0) + 1; })
    );

    // Snapshot before
    const today = todayISO();
    await supabase.from('balance_snapshots').insert({ snapshot_date: today, ...balance, trigger_reason: 'pre_complete' });

    // Decrement balance
    const newBalance = { ...balance };
    const updates = PRAYERS.map(p => {
      const done = Math.min(plannedCounts[p] || 0, balance[p] || 0);
      newBalance[p] = (balance[p] || 0) - done;
      return { prayer_type: p, remaining: newBalance[p], updated_at: new Date().toISOString() };
    });
    await supabase.from('qada_balance').upsert(updates, { onConflict: 'prayer_type' });

    // Snapshot after
    await supabase.from('balance_snapshots').insert({ snapshot_date: today, ...newBalance, trigger_reason: 'post_complete' });

    // Mark plan done
    if (planId) await supabase.from('daily_plans').update({ is_completed: true }).eq('id', planId);

    onBalanceChange(newBalance);
    setPlanCompleted(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Date nav
  const dates = useMemo(() => [
    offsetDate(activeDate, -1),
    activeDate,
    offsetDate(activeDate, 1),
  ], [activeDate]);

  return (
    <DragProvider onDrop={handleDrop}>
      {/* Date strip */}
      <View style={styles.dateStrip}>
        <TouchableOpacity onPress={() => setActiveDate(d => offsetDate(d, -1))} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>

        {dates.map(d => {
          const isActive = d === activeDate;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => setActiveDate(d)}
              style={[styles.datePill, isActive && styles.datePillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.datePillText, isActive && styles.datePillTextActive]}>
                {dayLabel(d)}
              </Text>
              {d === todayISO() && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity onPress={() => setActiveDate(d => offsetDate(d, 1))} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <PlannerInner
        balance={balance}
        activeDate={activeDate}
        assignments={assignments}
        planCompleted={planCompleted}
        loading={loading}
        onRemove={removeChip}
        onCompleteDay={handleCompleteDay}
      />
    </DragProvider>
  );
}

const styles = StyleSheet.create({
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: '300' },
  datePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  datePillActive: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderColor: 'rgba(167,139,250,0.3)',
  },
  datePillText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  datePillTextActive: { color: '#a78bfa' },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a78bfa',
  },
  scroll: { padding: 10 },
  loadingRow: { alignItems: 'center', paddingVertical: 40 },
  doneBanner: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  doneIcon: { fontSize: 24, marginBottom: 4 },
  doneTitle: { color: '#fff', fontWeight: '600', fontSize: 14 },
  doneSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 },
});
