import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../contexts/SettingsContext';
import { requestPermission, scheduleReminder, cancelReminder } from '../lib/notifications';
import { PRAYERS, PRAYER_CONFIG, Balance } from '../lib/prayers';

interface Props {
  balance: Balance;
  onSaveBalance: (b: Balance) => Promise<void>;
}

function Row({ label, value, onDec, onInc, color }: {
  label: string; value: number; onDec: () => void; onInc: () => void; color?: string;
}) {
  return (
    <View style={styles.counterRow}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterControls}>
        <TouchableOpacity onPress={onDec} style={styles.counterBtn} activeOpacity={0.7}>
          <Text style={[styles.counterBtnText, color ? { color } : {}]}>−</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity onPress={onInc} style={styles.counterBtn} activeOpacity={0.7}>
          <Text style={[styles.counterBtnText, color ? { color } : {}]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen({ balance, onSaveBalance }: Props) {
  const { settings, updateSettings } = useSettings();
  const [balanceValues, setBalanceValues] = useState<Balance>({ ...balance });
  const [savingBalance, setSavingBalance] = useState(false);

  function setB(prayer: keyof Balance, delta: number) {
    setBalanceValues(prev => ({ ...prev, [prayer]: Math.max(0, (prev[prayer] || 0) + delta) }));
  }

  async function handleBalanceSave() {
    setSavingBalance(true);
    await onSaveBalance(balanceValues);
    setSavingBalance(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function toggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow notifications in Settings to enable reminders.');
        return;
      }
      await updateSettings({ notificationsEnabled: true });
      const total = PRAYERS.reduce((s, p) => s + (balance[p] || 0), 0);
      await scheduleReminder(settings.notificationHour, settings.notificationMinute, total, settings.dailyCommitment);
    } else {
      await updateSettings({ notificationsEnabled: false });
      await cancelReminder();
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function updateTime(field: 'notificationHour' | 'notificationMinute', delta: number) {
    const max = field === 'notificationHour' ? 23 : 59;
    const cur = settings[field];
    const next = (cur + delta + max + 1) % (max + 1);
    await updateSettings({ [field]: next });
    if (settings.notificationsEnabled) {
      const total = PRAYERS.reduce((s, p) => s + (balance[p] || 0), 0);
      const h = field === 'notificationHour' ? next : settings.notificationHour;
      const m = field === 'notificationMinute' ? next : settings.notificationMinute;
      await scheduleReminder(h, m, total, settings.dailyCommitment);
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* Daily commitment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Commitment</Text>
        <Text style={styles.sectionSub}>How many qada prayers to plan each day</Text>
        <View style={styles.card}>
          <Row
            label="Prayers per day"
            value={settings.dailyCommitment}
            onDec={() => updateSettings({ dailyCommitment: Math.max(1, settings.dailyCommitment - 1) })}
            onInc={() => updateSettings({ dailyCommitment: Math.min(50, settings.dailyCommitment + 1) })}
          />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <Text style={styles.sectionSub}>Daily notification to plan your qada</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Enable reminders</Text>
              <Text style={styles.switchSub}>Daily notification at set time</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(124,58,237,0.7)' }}
              thumbColor={settings.notificationsEnabled ? '#a78bfa' : 'rgba(255,255,255,0.4)'}
            />
          </View>

          {settings.notificationsEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Reminder time</Text>
                <View style={styles.timeControls}>
                  <View style={styles.timeUnit}>
                    <TouchableOpacity onPress={() => updateTime('notificationHour', 1)} style={styles.timeBtn}>
                      <Text style={styles.timeBtnText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeNum}>{pad(settings.notificationHour)}</Text>
                    <TouchableOpacity onPress={() => updateTime('notificationHour', -1)} style={styles.timeBtn}>
                      <Text style={styles.timeBtnText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.timeSep}>:</Text>
                  <View style={styles.timeUnit}>
                    <TouchableOpacity onPress={() => updateTime('notificationMinute', 5)} style={styles.timeBtn}>
                      <Text style={styles.timeBtnText}>▲</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeNum}>{pad(settings.notificationMinute)}</Text>
                    <TouchableOpacity onPress={() => updateTime('notificationMinute', -5)} style={styles.timeBtn}>
                      <Text style={styles.timeBtnText}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Balance editor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qada Balance</Text>
        <Text style={styles.sectionSub}>Update your remaining prayer counts</Text>
        <View style={styles.card}>
          {PRAYERS.map(prayer => {
            const c = PRAYER_CONFIG[prayer];
            return (
              <View key={prayer}>
                <View style={styles.prayerRow}>
                  <Text style={styles.prayerIcon}>{c.icon}</Text>
                  <Text style={[styles.prayerName, { color: c.hex }]}>{c.name}</Text>
                  <Text style={styles.prayerArabic}>{c.arabic}</Text>
                  <View style={styles.counterControls}>
                    <TouchableOpacity onPress={() => setB(prayer, -1)} style={styles.counterBtn} activeOpacity={0.7}>
                      <Text style={[styles.counterBtnText, { color: c.hex }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{balanceValues[prayer]}</Text>
                    <TouchableOpacity onPress={() => setB(prayer, 1)} style={styles.counterBtn} activeOpacity={0.7}>
                      <Text style={[styles.counterBtnText, { color: c.hex }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {prayer !== 'isha' && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={handleBalanceSave}
          activeOpacity={0.8}
          disabled={savingBalance}
          style={[styles.saveBtn, savingBalance && { opacity: 0.6 }]}
        >
          <Text style={styles.saveBtnText}>{savingBalance ? 'Saving...' : 'Save Balance'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 3 },
  sectionSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  switchLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  switchSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  timeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeUnit: { alignItems: 'center', gap: 4 },
  timeBtn: { padding: 4 },
  timeBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  timeNum: { color: '#fff', fontSize: 22, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  timeSep: { color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '300', marginBottom: 4 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  counterLabel: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { color: '#a78bfa', fontSize: 20, lineHeight: 24 },
  counterValue: { color: '#fff', fontSize: 17, fontWeight: '700', minWidth: 36, textAlign: 'center' },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  prayerIcon: { fontSize: 20 },
  prayerName: { fontSize: 14, fontWeight: '600', width: 58 },
  prayerArabic: { color: 'rgba(255,255,255,0.3)', fontSize: 12, flex: 1 },
  saveBtn: { backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
