import React, {
  createContext, useContext, useRef, useState, useCallback, ReactNode,
} from 'react';
import { PanResponder, Animated, View, StyleSheet } from 'react-native';
import { PrayerType, SlotKey, SLOTS, PRAYER_CONFIG } from '../lib/prayers';

interface SlotRect { x: number; y: number; width: number; height: number; }

interface DragContextValue {
  isDragging: boolean;
  hoveredSlot: SlotKey | null;
  registerSlot: (id: SlotKey, ref: React.RefObject<View | null>) => void;
  makePanHandlers: (type: PrayerType) => ReturnType<typeof PanResponder.create>['panHandlers'];
}

const DragContext = createContext<DragContextValue>({
  isDragging: false,
  hoveredSlot: null,
  registerSlot: () => {},
  makePanHandlers: () => ({} as any),
});

export const useDrag = () => useContext(DragContext);

interface Props {
  children: ReactNode;
  onDrop: (type: PrayerType, slotId: SlotKey) => void;
}

export function DragProvider({ children, onDrop }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<SlotKey | null>(null);
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const draggedType = useRef<PrayerType | null>(null);
  const slotRefs = useRef<Map<SlotKey, React.RefObject<View | null>>>(new Map());
  const slotRects = useRef<Map<SlotKey, SlotRect>>(new Map());

  const registerSlot = useCallback((id: SlotKey, ref: React.RefObject<View | null>) => {
    slotRefs.current.set(id, ref);
  }, []);

  const measureAllSlots = useCallback(() => {
    slotRefs.current.forEach((ref, id) => {
      ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
        slotRects.current.set(id, { x: pageX, y: pageY, width, height });
      });
    });
  }, []);

  const findSlotAt = useCallback((px: number, py: number): SlotKey | null => {
    for (const [id, rect] of slotRects.current) {
      if (px >= rect.x && px <= rect.x + rect.width &&
          py >= rect.y && py <= rect.y + rect.height) {
        return id;
      }
    }
    return null;
  }, []);

  const makePanHandlers = useCallback((type: PrayerType) => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        measureAllSlots();
        const { pageX, pageY } = evt.nativeEvent;
        dragXY.setValue({ x: pageX - 30, y: pageY - 28 });
        draggedType.current = type;
        setIsDragging(true);
        setHoveredSlot(null);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        dragXY.setValue({ x: pageX - 30, y: pageY - 28 });
        const slot = findSlotAt(pageX, pageY);
        setHoveredSlot(slot);
      },
      onPanResponderRelease: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        const slot = findSlotAt(pageX, pageY);
        setIsDragging(false);
        setHoveredSlot(null);
        draggedType.current = null;
        if (slot) onDrop(type, slot);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        setHoveredSlot(null);
        draggedType.current = null;
      },
    });
    return responder.panHandlers;
  }, [measureAllSlots, findSlotAt, onDrop]);

  const c = draggedType.current ? PRAYER_CONFIG[draggedType.current] : null;

  return (
    <DragContext.Provider value={{ isDragging, hoveredSlot, registerSlot, makePanHandlers }}>
      {children}
      {isDragging && c && (
        <Animated.View
          pointerEvents="none"
          style={[styles.ghost, { transform: dragXY.getTranslateTransform() }]}
        >
          <View style={[styles.chip, { backgroundColor: c.dimHex, borderColor: c.hex }]}>
            <Animated.Text style={styles.chipIcon}>{c.icon}</Animated.Text>
            <Animated.Text style={[styles.chipText, { color: c.hex }]}>{c.name}</Animated.Text>
          </View>
        </Animated.View>
      )}
    </DragContext.Provider>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
