import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingState } from '@/components/CenterState';
import { getHomeStats, type HomeStats } from '@/db/queries';
import { useUserId } from '@/store/auth-context';
import { useDataVersion } from '@/store/data-context';
import { useSettings } from '@/store/settings-context';
import { contentMaxWidth, radius, shadow, spacing, type ThemeColors } from '@/theme';

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export default function HomeScreen() {
  const userId = useUserId();
  const version = useDataVersion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setError(false);
    getHomeStats(userId)
      .then((result) => {
        if (active) setStats(result);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // version isn't read here, but bumping it (on a realtime push from
    // another device) should trigger exactly this refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, version]);

  useFocusEffect(load);

  const dueToday = stats?.dueToday ?? 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={t('common.loadError')} onRetry={load} />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
    >
      <Text style={styles.greeting}>{t(greetingKey())}</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>{t('home.today')}</Text>
        <Text style={styles.heroNumber}>{dueToday}</Text>
        <Text style={styles.heroCaption}>{t('home.thingsToRemember')}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            dueToday === 0 && styles.startButtonDisabled,
            pressed && dueToday > 0 && styles.pressedDim,
          ]}
          disabled={dueToday === 0}
          onPress={() => router.push('/review')}
        >
          <Text style={styles.startButtonText}>{dueToday === 0 ? t('home.allCaughtUp') : t('home.startReview')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.reviseButton, pressed && styles.pressedDim]}
          onPress={() => router.push('/review?mode=revise')}
        >
          <Text style={styles.reviseButtonText}>{t('home.reviseAnytime')}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t('home.upcoming')}</Text>
      <View style={styles.upcomingRow}>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.dueTomorrow ?? 0}</Text>
          <Text style={styles.upcomingLabel}>{t('home.tomorrow')}</Text>
        </View>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.dueThisWeek ?? 0}</Text>
          <Text style={styles.upcomingLabel}>{t('home.thisWeek')}</Text>
        </View>
        <View style={styles.upcomingItem}>
          <Text style={styles.upcomingNumber}>{stats?.mature ?? 0}</Text>
          <Text style={styles.upcomingLabel}>{t('home.mature')}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.pressedDim]}
        onPress={() => router.push('/library')}
      >
        <Ionicons name="add-circle" size={22} color={colors.primary} />
        <Text style={styles.addButtonText}>{t('home.addKnowledge')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing(2.5), gap: spacing(2.5), width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    pressedDim: { opacity: 0.7 },
    greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing(3),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
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
    reviseButton: {
      marginTop: spacing(1),
      paddingVertical: spacing(1.25),
      paddingHorizontal: spacing(4),
      borderRadius: radius.md,
      width: '100%',
      alignItems: 'center',
    },
    reviseButtonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
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
      ...shadow.card,
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
}
