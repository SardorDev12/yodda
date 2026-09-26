import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { getSetting, setSetting } from '@/db/queries';
import { exportBackup, importBackup } from '@/lib/backup';
import { cancelAllReminders, isWeb, MAX_REMINDERS, scheduleReminders } from '@/lib/notifications';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

const DEFAULT_HOURS = [9, 14, 20];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [remindersOn, setRemindersOn] = useState(false);
  const [reminderCount, setReminderCount] = useState(1);
  const [reminderHours, setReminderHours] = useState<number[]>([DEFAULT_HOURS[0]]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([getSetting(db, 'notifOn'), getSetting(db, 'notifCount'), getSetting(db, 'notifHours')]).then(
      ([onValue, countValue, hoursValue]) => {
        const count = countValue ? Math.min(MAX_REMINDERS, Math.max(1, parseInt(countValue, 10))) : 1;
        const hours = hoursValue ? (JSON.parse(hoursValue) as number[]) : DEFAULT_HOURS.slice(0, count);
        setRemindersOn(onValue === '1');
        setReminderCount(count);
        setReminderHours(hours);
      }
    );
  }, [db]);

  async function persistAndSchedule(on: boolean, count: number, hours: number[]) {
    await Promise.all([
      setSetting(db, 'notifOn', on ? '1' : '0'),
      setSetting(db, 'notifCount', String(count)),
      setSetting(db, 'notifHours', JSON.stringify(hours)),
    ]);
    if (isWeb) return;
    if (on) {
      await scheduleReminders(hours);
    } else {
      await cancelAllReminders();
    }
  }

  async function toggleReminders(value: boolean) {
    setRemindersOn(value);
    await persistAndSchedule(value, reminderCount, reminderHours);
  }

  async function changeCount(count: number) {
    const hours = Array.from({ length: count }, (_, i) => reminderHours[i] ?? DEFAULT_HOURS[i] ?? 9);
    setReminderCount(count);
    setReminderHours(hours);
    if (remindersOn) await persistAndSchedule(true, count, hours);
    else {
      await setSetting(db, 'notifCount', String(count));
      await setSetting(db, 'notifHours', JSON.stringify(hours));
    }
  }

  async function changeHour(slot: number, hour: number) {
    const hours = reminderHours.map((h, i) => (i === slot ? hour : h));
    setReminderHours(hours);
    setPickerSlot(null);
    if (remindersOn) await persistAndSchedule(true, reminderCount, hours);
    else await setSetting(db, 'notifHours', JSON.stringify(hours));
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup(db);
    } catch {
      Alert.alert(t('settings.exportButton'), t('settings.exportError'));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importBackup(db);
      if (result) {
        Alert.alert(t('settings.importButton'), t('settings.importSuccess', { subjects: result.subjects, cards: result.cards }));
      }
    } catch {
      Alert.alert(t('settings.importButton'), t('settings.importError'));
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.rowLabel}>{t('settings.dailyReminder')}</Text>
          <Switch value={remindersOn} onValueChange={toggleReminders} disabled={isWeb} />
        </View>
        {isWeb && <Text style={styles.hint}>{t('settings.webHint')}</Text>}

        {!isWeb && remindersOn && (
          <>
            <Text style={styles.subLabel}>{t('settings.reminderCount')}</Text>
            <View style={styles.countRow}>
              {[1, 2, 3].map((count) => (
                <Pressable
                  key={count}
                  style={[styles.countChip, reminderCount === count && styles.countChipActive]}
                  onPress={() => changeCount(count)}
                >
                  <Text style={[styles.countChipText, reminderCount === count && styles.countChipTextActive]}>{count}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.subLabel}>{t('settings.reminderHours')}</Text>
            <View style={styles.hourRow}>
              {reminderHours.map((hour, slot) => (
                <Pressable key={slot} style={styles.hourChip} onPress={() => setPickerSlot(slot)}>
                  <Text style={styles.hourChipText}>{formatHour(hour)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <Text style={styles.hint}>{t('settings.dataText')}</Text>

        {!isWeb && (
          <View style={styles.backupRow}>
            <Pressable style={styles.backupButton} onPress={handleExport} disabled={exporting}>
              <Text style={styles.backupButtonText}>{exporting ? t('settings.exporting') : t('settings.exportButton')}</Text>
            </Pressable>
            <Pressable style={styles.backupButton} onPress={handleImport} disabled={importing}>
              <Text style={styles.backupButtonText}>{importing ? t('settings.importing') : t('settings.importButton')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable style={styles.section} onPress={() => router.push('/about')}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Text style={styles.rowLabel}>{t('settings.aboutText')}</Text>
        <Text style={styles.link}>{t('settings.howItWorks')}</Text>
      </Pressable>

      <Modal visible={pickerSlot !== null} transparent animationType="fade" onRequestClose={() => setPickerSlot(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerSlot(null)}>
          <Pressable style={styles.hourSheet}>
            <FlatList
              data={HOURS}
              keyExtractor={(h) => String(h)}
              numColumns={4}
              renderItem={({ item: hour }) => (
                <Pressable style={styles.hourOption} onPress={() => pickerSlot !== null && changeHour(pickerSlot, hour)}>
                  <Text style={styles.hourOptionText}>{formatHour(hour)}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing(2.5), gap: spacing(2) },
    section: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing(1),
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: 15, color: colors.text },
    hint: { fontSize: 13, color: colors.muted, lineHeight: 18 },
    subLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: spacing(1) },
    link: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    countRow: { flexDirection: 'row', gap: spacing(1) },
    countChip: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    countChipText: { color: colors.text, fontWeight: '700' },
    countChipTextActive: { color: '#fff' },
    hourRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
    hourChip: {
      paddingHorizontal: spacing(1.5),
      paddingVertical: spacing(1),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    hourChipText: { color: colors.primary, fontWeight: '700' },
    backupRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(0.5) },
    backupButton: {
      flex: 1,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.sm,
      paddingVertical: spacing(1.25),
      paddingHorizontal: spacing(1),
      alignItems: 'center',
      justifyContent: 'center',
    },
    backupButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13, textAlign: 'center' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing(3) },
    hourSheet: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(2),
      maxHeight: '70%',
    },
    hourOption: { flex: 1, alignItems: 'center', paddingVertical: spacing(1.5) },
    hourOptionText: { color: colors.text, fontWeight: '600' },
  });
}
