import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';

import { exportBackup, importBackup } from '@/lib/backup';
import { cancelDailyReminder, isWeb, scheduleDailyReminder } from '@/lib/notifications';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function toggleReminders(value: boolean) {
    setRemindersOn(value);
    if (isWeb) return;
    if (value) {
      await scheduleDailyReminder(9, 0, 0);
    } else {
      await cancelDailyReminder();
    }
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <Text style={styles.hint}>{t('settings.dataText')}</Text>

        {!isWeb && (
          <>
            <Text style={styles.backupHint}>{t('settings.backupHint')}</Text>
            <View style={styles.backupRow}>
              <Pressable style={styles.backupButton} onPress={handleExport} disabled={exporting}>
                <Text style={styles.backupButtonText}>{exporting ? t('settings.exporting') : t('settings.exportButton')}</Text>
              </Pressable>
              <Pressable style={styles.backupButton} onPress={handleImport} disabled={importing}>
                <Text style={styles.backupButtonText}>{importing ? t('settings.importing') : t('settings.importButton')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Pressable style={styles.section} onPress={() => router.push('/about')}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Text style={styles.rowLabel}>{t('settings.aboutText')}</Text>
        <Text style={styles.link}>{t('settings.howItWorks')}</Text>
      </Pressable>
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
    backupHint: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: spacing(0.5) },
    link: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    backupRow: { flexDirection: 'row', gap: spacing(1), marginTop: spacing(0.5) },
    backupButton: {
      flex: 1,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.sm,
      paddingVertical: spacing(1.25),
      alignItems: 'center',
    },
    backupButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  });
}
