import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrayerType, PRAYER_CONFIG, Assignments } from '../lib/prayers';
import SlotDropZone from './SlotDropZone';

interface Props {
  prayer: PrayerType;
  assignments: Assignments;
  onRemove: (chipId: string) => void;
}

export default function FardPrayerSection({ prayer, assignments, onRemove }: Props) {
  const c = PRAYER_CONFIG[prayer];
  const beforeKey = `${prayer}::before`;
  const afterKey = `${prayer}::after`;

  return (
    <View style={styles.card}>
      {/* Before */}
      <View style={styles.slotWrap}>
        <Text style={styles.slotLabel}>BEFORE</Text>
        <SlotDropZone id={beforeKey} chips={assignments[beforeKey] || []} onRemove={onRemove} />
      </View>

      {/* Fard divider */}
      <View style={[styles.divider, { backgroundColor: c.dimHex, borderColor: c.borderHex }]}>
        <Text style={styles.dividerIcon}>{c.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.dividerName}>{c.name}</Text>
          <Text style={styles.dividerArabic}>{c.arabic}</Text>
        </View>
        <Text style={styles.dividerTime}>{c.time}</Text>
      </View>

      {/* After */}
      <View style={styles.slotWrap}>
        <Text style={styles.slotLabel}>AFTER</Text>
        <SlotDropZone id={afterKey} chips={assignments[afterKey] || []} onRemove={onRemove} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 10,
  },
  slotWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.22)',
    marginBottom: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 14,
    borderWidth: 1,
  },
  dividerIcon: { fontSize: 22 },
  dividerName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dividerArabic: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 },
  dividerTime: { color: 'rgba(255,255,255,0.22)', fontSize: 11 },
});
