import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDrag } from '../contexts/DragContext';
import { ChipItem, SlotKey, PRAYER_CONFIG } from '../lib/prayers';

interface Props {
  id: SlotKey;
  chips: ChipItem[];
  onRemove: (chipId: string) => void;
}

export default function SlotDropZone({ id, chips, onRemove }: Props) {
  const { hoveredSlot, registerSlot } = useDrag();
  const ref = useRef<View>(null);
  const isHovered = hoveredSlot === id;

  useEffect(() => {
    registerSlot(id, ref);
  }, [id, registerSlot]);

  return (
    <View
      ref={ref}
      onLayout={() => registerSlot(id, ref)}
      style={[
        styles.zone,
        chips.length === 0 && styles.empty,
        isHovered && styles.hovered,
      ]}
    >
      {chips.length === 0 && (
        <Text style={[styles.placeholder, isHovered && styles.placeholderHovered]}>
          {isHovered ? '↓' : '·'}
        </Text>
      )}
      {chips.map(chip => {
        const c = PRAYER_CONFIG[chip.type];
        return (
          <View key={chip.id} style={[styles.chip, { backgroundColor: c.dimHex, borderColor: c.borderHex }]}>
            <Text style={styles.chipIcon}>{c.icon}</Text>
            <TouchableOpacity
              onPress={() => onRemove(chip.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    minHeight: 48,
    borderRadius: 10,
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  placeholder: { fontSize: 16, color: 'rgba(255,255,255,0.15)' },
  placeholderHovered: { color: 'rgba(255,255,255,0.5)' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 13 },
  removeText: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
});
