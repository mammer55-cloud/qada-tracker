import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

  const measure = () => {
    registerSlot(id, ref);
  };

  return (
    <View
      ref={ref}
      onLayout={measure}
      style={[
        styles.zone,
        chips.length === 0 && styles.empty,
        isHovered && styles.hovered,
      ]}
    >
      {chips.length === 0 && !isHovered && (
        <Text style={styles.placeholder}>drop here</Text>
      )}
      {isHovered && chips.length === 0 && (
        <Text style={[styles.placeholder, { color: 'rgba(255,255,255,0.5)' }]}>drop here</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {chips.map(chip => {
          const c = PRAYER_CONFIG[chip.type];
          return (
            <View key={chip.id} style={[styles.chip, { backgroundColor: c.dimHex, borderColor: c.borderHex }]}>
              <Text style={styles.chipIcon}>{c.icon}</Text>
              <Text style={[styles.chipText, { color: c.hex }]}>{c.name}</Text>
              <TouchableOpacity
                onPress={() => onRemove(chip.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  hovered: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholder: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
  },
  scroll: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipIcon: { fontSize: 13 },
  chipText: { fontSize: 12, fontWeight: '600' },
  removeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  removeText: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
});
