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
    <View style={[styles.card, { borderColor: 'rgba(255,255,255,0.07)' }]}>
      <View style={styles.row}>

        {/* LEFT — Before */}
        <View style={styles.slotCol}>
          <Text style={styles.slotLabel}>BEFORE</Text>
          <SlotDropZone id={beforeKey} chips={assignments[beforeKey] || []} onRemove={onRemove} />
        </View>

        {/* CENTER — Fard prayer */}
        <View style={[styles.center, { backgroundColor: c.dimHex, borderColor: c.borderHex }]}>
          <Text style={styles.centerIcon}>{c.icon}</Text>
          <Text style={[styles.centerName, { color: c.hex }]}>{c.name}</Text>
          <Text style={styles.centerArabic}>{c.arabic}</Text>
        </View>

        {/* RIGHT — After */}
        <View style={styles.slotCol}>
          <Text style={[styles.slotLabel, styles.slotLabelRight]}>AFTER</Text>
          <SlotDropZone id={afterKey} chips={assignments[afterKey] || []} onRemove={onRemove} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  slotCol: {
    flex: 1,
  },
  slotLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
    textAlign: 'left',
  },
  slotLabelRight: {
    textAlign: 'right',
  },
  center: {
    width: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  centerIcon: { fontSize: 20 },
  centerName: { fontSize: 11, fontWeight: '800' },
  centerArabic: { fontSize: 10, color: 'rgba(255,255,255,0.35)' },
});
