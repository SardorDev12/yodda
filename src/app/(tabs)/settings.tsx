import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { cancelDailyReminder, isWeb, scheduleDailyReminder } from '@/lib/notifications';
import { runFullSync } from '@/lib/sync';
import { useAuth } from '@/store/auth-context';
import { colors, radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { isConfigured, user, signOut } = useAuth();
  const [remindersOn, setRemindersOn] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function toggleReminders(value: boolean) {
    setRemindersOn(value);
    if (isWeb) return;
    if (value) {
      await scheduleDailyReminder(9, 0, 0);
    } else {
      await cancelDailyReminder();
    }
  }

  async function handleSyncNow() {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await runFullSync(db, user.id);
      Alert.alert('Synced', `Pushed ${result.pushed}, pulled ${result.pulled} cards.`);
    } catch {
      Alert.alert('Sync failed', 'Please check your connection and try again.');
    } finally {
      setSyncing(false);
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
        <Text style={styles.sectionTitle}>Account & sync</Text>
        {!isConfigured ? (
          <Text style={styles.hint}>
            Cloud sync isn&apos;t configured for this build. Set EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_ANON_KEY to enable it (see README).
          </Text>
        ) : user ? (
          <>
            <Text style={styles.rowLabel}>Signed in as {user.email}</Text>
            <Pressable style={styles.button} onPress={handleSyncNow} disabled={syncing}>
              <Text style={styles.buttonText}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
            </Pressable>
            <Pressable style={styles.buttonOutline} onPress={() => signOut()}>
              <Text style={styles.buttonOutlineText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Sign in to enable sync</Text>
          </Pressable>
        )}
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
  button: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing(1.5), alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  buttonOutline: { borderWidth: 1, borderColor: colors.danger, borderRadius: radius.sm, paddingVertical: spacing(1.5), alignItems: 'center' },
  buttonOutlineText: { color: colors.danger, fontWeight: '700' },
});
