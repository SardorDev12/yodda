import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getHomeStats, type HomeStats } from '@/db/queries';
import { colors, radius, spacing } from '@/theme';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [stats, setStats] = useState<HomeStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHomeStats(db).then((result) => {
        if (active) setStats(result);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  const dueToday = stats?.dueToday ?? 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{greeting()}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TODAY</Text>
        <Text style={styles.heroNumber}>{dueToday}</Text>
        <Text style={styles.heroCaption}>things to remember</Text>

        <Pressable
          style={[styles.startButton, dueToday === 0 && styles.startButtonDisabled]}
          disabled={dueToday === 0}
          onPress={() => router.push('/review')}
        >
          <Text style={styles.startButtonText}>{dueToday === 0 ? 'All caught up' : 'Start Review'}</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.smallCard}>
          <Text style={styles.smallCardNumber}>{stats?.newCards ?? 0}</Text>
          <Text style={styles.smallCardLabel}>Learning · new</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Upcoming</Text>
      <View style={styles.upcomingRow}>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.dueTomorrow ?? 0}</Text>
          <Text style={styles.upcomingLabel}>Tomorrow</Text>
        </View>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.dueThisWeek ?? 0}</Text>
          <Text style={styles.upcomingLabel}>This week</Text>
        </View>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.mature ?? 0}</Text>
          <Text style={styles.upcomingLabel}>Mature</Text>
        </View>
      </View>

      <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
        <Ionicons name="add-circle" size={22} color={colors.primary} />
        <Text style={styles.addButtonText}>Add knowledge</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(2.5), paddingTop: spacing(8), gap: spacing(2.5) },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing(3),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1 },
  heroNumber: { fontSize: 56, fontWeight: '800', color: colors.text, marginTop: spacing(0.5) },
  heroCaption: { fontSize: 14, color: colors.muted, marginBottom: spacing(2) },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(4),
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  startButtonDisabled: { backgroundColor: colors.border },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', gap: spacing(1.5) },
  smallCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallCardNumber: { fontSize: 24, fontWeight: '700', color: colors.text },
  smallCardLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing(1) },
  upcomingRow: { flexDirection: 'row', gap: spacing(1.5) },
  upcomingItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing(2),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
  upcomingLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    paddingVertical: spacing(2),
    marginTop: spacing(1),
  },
  addButtonText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
