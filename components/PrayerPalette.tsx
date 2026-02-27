import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useDrag } from '../contexts/DragContext';
import { PRAYERS, PRAYER_CONFIG, Balance, Assignments } from '../lib/prayers';

interface Props {
  balance: Balance;
  assignments: Assignments;
}

export default function PrayerPalette({ balance, assignments }: Props) {
  const { makePanHandlers } = useDrag();

  const plannedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PRAYERS.forEach(p => { counts[p] = 0; });
    Object.values(assignments).forEach(chips => {
      chips.forEach(chip => { counts[chip.type] = (counts[chip.type] || 0) + 1; });
    });
    return counts;
  }, [assignments]);

  // Create pan handlers once per prayer type (memoized inside makePanHandlers)
  const handlers = useMemo(
    () => Object.fromEntries(PRAYERS.map(p => [p, makePanHandlers(p)])),
    [makePanHandlers]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>DRAG TO PLAN</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRAYERS.map(type => {
          const c = PRAYER_CONFIG[type];
          const rem = balance[type] || 0;
          const planned = plannedCounts[type] || 0;
          return (
            <View
              key={type}
              {...handlers[type]}
              style={[styles.item, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.09)' }]}
            >
              <Text style={styles.itemIcon}>{c.icon}</Text>
              <Text style={[styles.itemName, { color: c.hex }]}>{c.name}</Text>
              <View style={[styles.badge, { backgroundColor: rem === 0 ? 'rgba(255,255,255,0.06)' : c.dimHex }]}>
                <Text style={[styles.badgeText, { color: rem === 0 ? 'rgba(255,255,255,0.25)' : c.hex }]}>
                  {rem}
                </Text>
              </View>
              {planned > 0 && (
                <Text style={styles.planned}>-{planned}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8 },
  item: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    minWidth: 62,
  },
  itemIcon: { fontSize: 22 },
  itemName: { fontSize: 11, fontWeight: '700' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  planned: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
});
