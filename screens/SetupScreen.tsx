import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { PRAYERS, PRAYER_CONFIG, Balance } from '../lib/prayers';

interface Props {
  balance: Balance;
  onSave: (b: Balance) => Promise<void>;
  isFirstTime: boolean;
}

export default function SetupScreen({ balance, onSave, isFirstTime }: Props) {
  const [values, setValues] = useState<Balance>({ ...balance });
  const [saving, setSaving] = useState(false);

  function set(prayer: keyof Balance, delta: number) {
    setValues(prev => ({
      ...prev,
      [prayer]: Math.max(0, (prev[prayer] || 0) + delta),
    }));
  }

  const total = PRAYERS.reduce((s, p) => s + (values[p] || 0), 0);

  async function handleSave() {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isFirstTime && (
          <View style={styles.welcome}>
            <Text style={styles.welcomeIcon}>🌙</Text>
            <Text style={styles.welcomeTitle}>Welcome</Text>
            <Text style={styles.welcomeSub}>
              Enter how many qada prayers you have remaining for each type.
            </Text>
          </View>
        )}

        {!isFirstTime && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Edit Balance</Text>
            <Text style={styles.sectionSub}>Update your remaining qada counts.</Text>
          </View>
        )}

        {PRAYERS.map(prayer => {
          const c = PRAYER_CONFIG[prayer];
          return (
            <View key={prayer} style={[styles.row, { backgroundColor: c.dimHex, borderColor: c.borderHex }]}>
              <Text style={styles.rowIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{c.name}</Text>
                <Text style={styles.rowSub}>{c.arabic} · {c.time}</Text>
              </View>
              <View style={styles.counter}>
                <TouchableOpacity onPress={() => set(prayer, -1)} style={styles.counterBtn} activeOpacity={0.7}>
                  <Text style={[styles.counterBtnText, { color: c.hex }]}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={String(values[prayer])}
                  onChangeText={v => {
                    const n = parseInt(v, 10);
                    setValues(prev => ({ ...prev, [prayer]: isNaN(n) || n < 0 ? 0 : n }));
                  }}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <TouchableOpacity onPress={() => set(prayer, 1)} style={styles.counterBtn} activeOpacity={0.7}>
                  <Text style={[styles.counterBtnText, { color: c.hex }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total remaining</Text>
          <Text style={styles.totalNum}>{total.toLocaleString()}</Text>
          <Text style={styles.totalSub}>prayers</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : isFirstTime ? 'Start Tracking' : 'Save Balance'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  welcome: {
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeIcon: { fontSize: 36, marginBottom: 8 },
  welcomeTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  welcomeSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowIcon: { fontSize: 28 },
  rowName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  rowSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  counterBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  input: {
    width: 56, height: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 14,
    marginTop: 4,
  },
  totalLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 13, flex: 1 },
  totalNum: { color: '#fff', fontSize: 28, fontWeight: '800' },
  totalSub: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  saveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
