import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PRAYERS, PRAYER_CONFIG, Balance, Assignments } from '../lib/prayers';

interface Props {
  balance: Balance;
  assignments: Assignments;
  completedToday: boolean;
  isFuture?: boolean;
  onCompleteDay: () => void;
}

export default function BalanceSummary({ balance, assignments, completedToday, isFuture, onCompleteDay }: Props) {
  const plannedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PRAYERS.forEach(p => { counts[p] = 0; });
    Object.values(assignments).forEach(chips =>
      chips.forEach(chip => { counts[chip.type] = (counts[chip.type] || 0) + 1; })
    );
    return counts;
  }, [assignments]);

  const totalRemaining = PRAYERS.reduce((s, p) => s + (balance[p] || 0), 0);
  const totalPlanned = PRAYERS.reduce((s, p) => s + (plannedCounts[p] || 0), 0);

  const canComplete = !completedToday && !isFuture && totalPlanned > 0;

  let btnLabel = 'Plan first';
  if (completedToday) btnLabel = 'Done ✓';
  else if (isFuture) btnLabel = 'Pre-planned';
  else if (totalPlanned > 0) btnLabel = `Complete ${totalPlanned}`;

  return (
    <View style={styles.container}>
      <View style={styles.prayerRow}>
        {PRAYERS.map(p => {
          const c = PRAYER_CONFIG[p];
          const rem = balance[p] || 0;
          const planned = plannedCounts[p] || 0;
          return (
            <View key={p} style={styles.prayerCol}>
              <Text style={styles.prayerIcon}>{c.icon}</Text>
              <Text style={[styles.prayerCount, { color: rem === 0 ? 'rgba(255,255,255,0.2)' : c.hex }]}>{rem}</Text>
              {planned > 0 && <Text style={styles.prayerPlanned}>-{planned}</Text>}
            </View>
          );
        })}
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.totalLabel}>Total remaining</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalNum}>{totalRemaining.toLocaleString()}</Text>
            {totalPlanned > 0 && (
              <Text style={styles.totalAfter}>→ {Math.max(0, totalRemaining - totalPlanned).toLocaleString()}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={canComplete ? onCompleteDay : undefined}
          activeOpacity={canComplete ? 0.75 : 1}
          style={[
            styles.btn,
            completedToday && styles.btnDone,
            isFuture && styles.btnFuture,
            !canComplete && !completedToday && !isFuture && styles.btnDisabled,
          ]}
        >
          <Text style={[styles.btnText, (completedToday || isFuture) && { color: '#a78bfa' }]}>
            {btnLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(10,15,30,0.97)',
  },
  prayerRow: { flexDirection: 'row', marginBottom: 12 },
  prayerCol: { flex: 1, alignItems: 'center', gap: 2 },
  prayerIcon: { fontSize: 16 },
  prayerCount: { fontSize: 13, fontWeight: '700' },
  prayerPlanned: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  totalNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
  totalAfter: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  btn: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 16, backgroundColor: '#7c3aed' },
  btnDone: { backgroundColor: 'rgba(167,139,250,0.12)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' },
  btnFuture: { backgroundColor: 'rgba(167,139,250,0.08)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  btnDisabled: { backgroundColor: 'rgba(255,255,255,0.06)' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
