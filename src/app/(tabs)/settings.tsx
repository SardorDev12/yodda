import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cancelDailyReminder, isWeb, scheduleDailyReminder } from '@/lib/notifications';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [remindersOn, setRemindersOn] = useState(false);

  async function toggleReminders(value: boolean) {
    setRemindersOn(value);
    if (isWeb) return;
    if (value) {
      await scheduleDailyReminder(9, 0, 0);
    } else {
      await cancelDailyReminder();
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
    link: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  });
}
