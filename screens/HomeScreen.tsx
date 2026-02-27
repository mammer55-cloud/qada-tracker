import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';
import { PRAYERS, PRAYER_CONFIG, Balance } from '../lib/prayers';
import { useSettings } from '../contexts/SettingsContext';
import { todayLabel } from '../lib/prayers';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

interface Props {
  balance: Balance;
  initialBalance: Balance;
  todayPlanned: number;
}

export default function HomeScreen({ balance, initialBalance, todayPlanned }: Props) {
  const { settings } = useSettings();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(24)).current;
  const cardAnims = useRef(PRAYERS.map(() => new Animated.Value(0))).current;

  const total = useMemo(() => PRAYERS.reduce((s, p) => s + (balance[p] || 0), 0), [balance]);
  const totalInitial = useMemo(() => PRAYERS.reduce((s, p) => s + (initialBalance[p] || 0), 0), [initialBalance]);
  const totalCompleted = Math.max(0, totalInitial - total);
  const overallProgress = totalInitial > 0 ? totalCompleted / totalInitial : 0;
  const goalMet = todayPlanned >= settings.dailyCommitment;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(riseAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.stagger(
      80,
      cardAnims.map(a =>
        Animated.spring(a, { toValue: 1, tension: 120, friction: 9, useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Date */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: riseAnim }] }}>
        <Text style={styles.dateLabel}>{todayLabel()}</Text>
      </Animated.View>

      {/* Total hero */}
      <Animated.View
        style={[styles.heroCard, { opacity: fadeAnim, transform: [{ translateY: riseAnim }] }]}
      >
        <Text style={styles.heroMoon}>🌙</Text>
        <Text style={styles.heroNum}>{total.toLocaleString()}</Text>
        <Text style={styles.heroLabel}>prayers remaining</Text>
        {totalInitial > 0 && (
          <View style={styles.heroProgressWrap}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${Math.round(overallProgress * 100)}%` }]} />
            </View>
            <Text style={styles.heroProgressLabel}>
              {totalCompleted.toLocaleString()} completed of {totalInitial.toLocaleString()}
            </Text>
          </View>
        )}
        {total === 0 && totalInitial > 0 && (
          <Text style={styles.heroComplete}>Masha'Allah — all complete ✨</Text>
        )}
      </Animated.View>

      {/* Prayer cards grid */}
      <View style={styles.grid}>
        {PRAYERS.map((prayer, idx) => {
          const c = PRAYER_CONFIG[prayer];
          const count = balance[prayer] || 0;
          const isLast = idx === 4;
          return (
            <Animated.View
              key={prayer}
              style={[
                styles.card,
                isLast && styles.cardCenter,
                {
                  backgroundColor: c.dimHex,
                  borderColor: c.borderHex,
                  opacity: cardAnims[idx],
                  transform: [{ scale: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                },
              ]}
            >
              <Text style={styles.cardIcon}>{c.icon}</Text>
              <Text style={[styles.cardCount, { color: c.hex, opacity: count === 0 ? 0.35 : 1 }]}>
                {count.toLocaleString()}
              </Text>
              <Text style={[styles.cardName, { color: c.hex }]}>{c.name}</Text>
              <Text style={styles.cardArabic}>{c.arabic}</Text>
              {(() => {
                const init = initialBalance[prayer] || 0;
                const done = Math.max(0, init - count);
                const pct = init > 0 ? done / init : 0;
                return init > 0 ? (
                  <View style={styles.cardProgressWrap}>
                    <View style={styles.cardProgressTrack}>
                      <View style={[styles.cardProgressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: c.hex }]} />
                    </View>
                    <Text style={[styles.cardProgressLabel, { color: c.hex }]}>
                      {done}/{init}
                    </Text>
                  </View>
                ) : null;
              })()}
              {count === 0 && (
                <View style={[styles.doneBadge, { borderColor: c.borderHex }]}>
                  <Text style={[styles.doneBadgeText, { color: c.hex }]}>Done ✓</Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Daily goal card */}
      <Animated.View style={[styles.goalCard, { opacity: fadeAnim }]}>
        <View style={styles.goalRow}>
          <View>
            <Text style={styles.goalTitle}>Daily goal</Text>
            <Text style={styles.goalSub}>prayers to plan each day</Text>
          </View>
          <Text style={styles.goalNum}>{settings.dailyCommitment}</Text>
        </View>

        <View style={styles.goalDivider} />

        <View style={styles.goalRow}>
          <View>
            <Text style={styles.goalTitle}>Planned today</Text>
            <Text style={styles.goalSub}>{goalMet ? 'Goal reached!' : `${settings.dailyCommitment - todayPlanned} more to go`}</Text>
          </View>
          <Text style={[styles.goalNum, { color: goalMet ? '#4ade80' : '#fff' }]}>
            {todayPlanned} / {settings.dailyCommitment}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (todayPlanned / settings.dailyCommitment) * 100)}%`,
                backgroundColor: goalMet ? '#4ade80' : '#a78bfa',
              },
            ]}
          />
        </View>
      </Animated.View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  dateLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  heroCard: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroMoon: { fontSize: 40, marginBottom: 8 },
  heroNum: { fontSize: 64, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  heroComplete: { fontSize: 13, color: '#a78bfa', marginTop: 8, fontWeight: '600' },
  heroProgressWrap: { width: '100%', marginTop: 12, gap: 5 },
  heroProgressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: '#a78bfa', borderRadius: 3 },
  heroProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  card: {
    width: CARD_W,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  cardCenter: {
    alignSelf: 'center',
  },
  cardIcon: { fontSize: 30, marginBottom: 4 },
  cardCount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  cardName: { fontSize: 13, fontWeight: '700' },
  cardArabic: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  cardProgressWrap: { width: '100%', gap: 3, marginTop: 4 },
  cardProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  cardProgressFill: { height: '100%', borderRadius: 2 },
  cardProgressLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', opacity: 0.7 },
  doneBadge: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: { fontSize: 10, fontWeight: '600' },

  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalTitle: { color: '#fff', fontWeight: '600', fontSize: 14 },
  goalSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  goalNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  goalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
});
