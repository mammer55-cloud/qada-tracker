import React, { useCallback, useRef } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useDrag, DragProvider } from '../contexts/DragContext';
import { PRAYERS, PrayerType, SlotKey, Assignments, Balance, initAssignments } from '../lib/prayers';
import PrayerPalette from '../components/PrayerPalette';
import FardPrayerSection from '../components/FardPrayerSection';
import BalanceSummary from '../components/BalanceSummary';

interface Props {
  balance: Balance;
  assignments: Assignments;
  completedToday: boolean;
  onAssignmentsChange: (a: Assignments) => void;
  onCompleteDay: (counts: Record<PrayerType, number>) => Promise<void>;
}

function PlannerInner({ balance, assignments, completedToday, onAssignmentsChange, onCompleteDay }: Props) {
  const { isDragging } = useDrag();
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;

  const removeChip = useCallback((chipId: string) => {
    const next: Assignments = {} as Assignments;
    Object.keys(assignmentsRef.current).forEach(k => {
      next[k as SlotKey] = assignmentsRef.current[k as SlotKey].filter(c => c.id !== chipId);
    });
    onAssignmentsChange(next);
  }, [onAssignmentsChange]);

  function handleCompleteDay() {
    const counts: Record<PrayerType, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    Object.values(assignmentsRef.current).forEach(chips =>
      chips.forEach(chip => { counts[chip.type] = (counts[chip.type] || 0) + 1; })
    );
    onCompleteDay(counts);
  }

  return (
    <View style={{ flex: 1 }}>
      <PrayerPalette balance={balance} assignments={assignments} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
      >
        {completedToday && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedIcon}>✨</Text>
            <Text style={styles.completedTitle}>Today's plan is complete!</Text>
            <Text style={styles.completedSub}>Come back tomorrow, insha'Allah.</Text>
          </View>
        )}

        {PRAYERS.map(prayer => (
          <FardPrayerSection
            key={prayer}
            prayer={prayer}
            assignments={assignments}
            onRemove={removeChip}
          />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      <BalanceSummary
        balance={balance}
        assignments={assignments}
        completedToday={completedToday}
        onCompleteDay={handleCompleteDay}
      />
    </View>
  );
}

export default function PlannerScreen(props: Props) {
  const { assignments, onAssignmentsChange } = props;
  const assignmentsRef = useRef(assignments);
  assignmentsRef.current = assignments;

  const handleDrop = useCallback((type: PrayerType, slotId: SlotKey) => {
    const current = assignmentsRef.current;
    const newChip = { id: Math.random().toString(36).slice(2), type };
    const next: Assignments = {} as Assignments;
    Object.keys(current).forEach(k => { next[k as SlotKey] = [...current[k as SlotKey]]; });
    next[slotId] = [...next[slotId], newChip];
    onAssignmentsChange(next);
  }, [onAssignmentsChange]);

  return (
    <DragProvider onDrop={handleDrop}>
      <PlannerInner {...props} />
    </DragProvider>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 12 },
  completedBanner: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  completedIcon: { fontSize: 24, marginBottom: 4 },
  completedTitle: { color: '#fff', fontWeight: '600', fontSize: 14 },
  completedSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 },
});
