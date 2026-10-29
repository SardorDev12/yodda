import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';
import { ConfirmModal } from '@/components/modals';
import { AppText, Button, Screen, SectionTitle, SegmentedControl, Stepper, Surface } from '@/components/ui';
import { BackupError, buildBackup, parseBackup, restoreBackup } from '@/data/backup';
import { exportJson, pickJson } from '@/data/files';
import { languageNames, type Language } from '@/i18n/translations';
import { requestNotificationPermission, syncReminderTask } from '@/lib/reminders';
import { useAuth } from '@/providers/AuthProvider';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';
import { space } from '@/theme/tokens';

const DEFAULT_HOURS = [9, 14, 20];
const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

export default function SettingsScreen() {
  const router = useRouter();
  const { t, colors, settings, update } = useSettings();
  const { session, signOut } = useAuth();
  const { bump } = useDataVersion();
  const toast = useToast();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const isWeb = Platform.OS === 'web';
  const { reminder } = settings;

  const setReminder = (next: typeof reminder) => {
    update({ reminder: next });
    syncReminderTask(next.enabled);
  };

  const toggleReminder = async (enabled: boolean) => {
    if (enabled && !(await requestNotificationPermission())) {
      toast(t('notificationsDenied'), 'error');
      return;
    }
    setReminder({ ...reminder, enabled });
  };

  const setCount = (n: number) => {
    const hours = Array.from({ length: n }, (_, i) => reminder.hours[i] ?? DEFAULT_HOURS[i]);
    setReminder({ ...reminder, hours });
  };

  const setHour = (i: number, h: number) => {
    const hours = [...reminder.hours];
    hours[i] = h;
    setReminder({ ...reminder, hours });
  };

  const doExport = async () => {
    setBusy('export');
    try {
      const backup = await buildBackup();
      await exportJson(`yodda-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2));
      toast(t('exportDone'));
    } catch {
      toast(t('genericError'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const doImport = async () => {
    setBusy('import');
    try {
      const text = await pickJson();
      if (text === null) return;
      const result = await restoreBackup(parseBackup(text));
      bump();
      toast(t('importDone', result));
    } catch (e) {
      if (e instanceof BackupError) toast(e.code === 'tooNew' ? t('importTooNew') : t('importInvalid'), 'error');
      else toast(t('genericError'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <SectionTitle>{t('language')}</SectionTitle>
      <SegmentedControl<Language>
        label={t('language')}
        value={settings.language}
        onChange={(language) => update({ language })}
        options={(Object.keys(languageNames) as Language[]).map((l) => ({ value: l, label: languageNames[l] }))}
      />

      <SectionTitle>{t('theme')}</SectionTitle>
      <SegmentedControl
        label={t('theme')}
        value={settings.theme}
        onChange={(theme) => update({ theme })}
        options={[
          { value: 'light', label: t('light') },
          { value: 'dark', label: t('dark') },
        ]}
      />

      <SectionTitle>{t('reviewOrder')}</SectionTitle>
      <SegmentedControl
        label={t('reviewOrder')}
        value={settings.reviewOrder}
        onChange={(reviewOrder) => update({ reviewOrder })}
        options={[
          { value: 'question', label: t('questionFirst') },
          { value: 'answer', label: t('answerFirst') },
        ]}
      />

      <SectionTitle>{t('dailyReminder')}</SectionTitle>
      <Surface>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{t('dailyReminder')}</AppText>
            <AppText variant="caption" muted>
              {isWeb ? t('reminderWebOnly') : t('reminderSub')}
            </AppText>
          </View>
          <Switch
            value={reminder.enabled && !isWeb}
            disabled={isWeb}
            onValueChange={toggleReminder}
            accessibilityLabel={t('dailyReminder')}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
        {reminder.enabled && !isWeb ? (
          <View style={styles.reminderBody}>
            <View style={styles.rowBetween}>
              <AppText>{t('remindersPerDay')}</AppText>
              <Stepper label={t('remindersPerDay')} value={reminder.hours.length} min={1} max={3} onChange={setCount} />
            </View>
            {reminder.hours.map((h, i) => (
              <View key={i} style={styles.rowBetween}>
                <AppText>{t('reminderTime', { n: i + 1 })}</AppText>
                <Stepper
                  label={t('reminderTime', { n: i + 1 })}
                  value={h}
                  min={0}
                  max={23}
                  format={fmtHour}
                  onChange={(v) => setHour(i, v)}
                />
              </View>
            ))}
          </View>
        ) : null}
      </Surface>

      <SectionTitle>{t('backup')}</SectionTitle>
      <Surface>
        <AppText variant="caption" muted>
          {t('backupSub')}
        </AppText>
        <View style={styles.buttons}>
          <Button
            label={t('exportData')}
            icon="share-outline"
            variant="secondary"
            loading={busy === 'export'}
            disabled={busy !== null}
            onPress={doExport}
            style={styles.flex}
          />
          <Button
            label={t('importData')}
            icon="download-outline"
            variant="secondary"
            loading={busy === 'import'}
            disabled={busy !== null}
            onPress={doImport}
            style={styles.flex}
          />
        </View>
      </Surface>

      <SectionTitle>{t('account')}</SectionTitle>
      <Surface>
        <View>
          <AppText variant="caption" muted>
            {t('signedInAs')}
          </AppText>
          <AppText variant="bodyStrong" selectable>
            {session?.user.email}
          </AppText>
        </View>
        <Button label={t('signOut')} icon="log-out-outline" variant="secondary" onPress={() => setConfirmSignOut(true)} />
      </Surface>

      <Pressable
        onPress={() => router.push('/about')}
        accessibilityRole="button"
        accessibilityLabel={t('about')}
        style={({ pressed }) => [
          styles.about,
          { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t('about')}</AppText>
          <AppText variant="caption" muted>
            {t('aboutSub')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      <ConfirmModal
        visible={confirmSignOut}
        title={t('signOut')}
        body={t('signOutConfirm')}
        confirmLabel={t('signOut')}
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  reminderBody: { gap: space.md, paddingTop: space.sm },
  buttons: { flexDirection: 'row', gap: space.md },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
