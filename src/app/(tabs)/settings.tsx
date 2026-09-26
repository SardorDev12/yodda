import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { cancelDailyReminder, isWeb, scheduleDailyReminder } from '@/lib/notifications';
import { colors, radius, spacing } from '@/theme';

export default function SettingsScreen() {
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
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.rowLabel}>Daily reminder at 9:00 AM</Text>
          <Switch value={remindersOn} onValueChange={toggleReminders} disabled={isWeb} />
        </View>
        {isWeb && <Text style={styles.hint}>Local notifications aren&apos;t available on web.</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Text style={styles.hint}>
          Everything you add stays on this device only, stored locally in SQLite. There is no
          account and nothing is sent to the cloud.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.hint}>Yodda · Learn once. Remember longer.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingTop: spacing(8), gap: spacing(2) },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
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
});
