import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeIn, useCountUp } from '@/components/motion';
import { AppText, Button, ErrorState, Loading, Screen, Surface } from '@/components/ui';
import { getHomeStats } from '@/data/library';
import { useRefetch } from '@/lib/useRefetch';
import { useSettings } from '@/providers/SettingsProvider';
import { radius, space } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { t, plural, colors } = useSettings();
  const { data: stats, error, loading, retry } = useRefetch(getHomeStats);

  const dueShown = useCountUp(stats?.dueToday ?? 0);
  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? t('goodNight') : hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : hour < 22 ? t('goodEvening') : t('goodNight');

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.bg }]}>
      <Screen>
        <FadeIn>
          <AppText variant="title" accessibilityRole="header">
            {greeting}
          </AppText>
        </FadeIn>

        {loading && !stats ? (
          <Loading />
        ) : error && !stats ? (
          <ErrorState message={error} onRetry={retry} />
        ) : stats ? (
          <>
            <FadeIn delay={80}>
            <View style={[styles.hero, { backgroundColor: colors.primary }]}>
              <AppText variant="caption" color={colors.onPrimary} style={styles.heroLabel}>
                {t('dueToday').toUpperCase()}
              </AppText>
              <AppText
                color={colors.onPrimary}
                style={styles.heroCount}
                accessibilityLabel={plural('cardsDue', stats.dueToday)}
              >
                {dueShown}
              </AppText>
              <AppText color={colors.onPrimary} style={styles.heroSub}>
                {stats.dueToday > 0 ? plural('cardsDue', stats.dueToday) : t('allCaughtUpSub')}
              </AppText>
              <Pressable
                disabled={stats.dueToday === 0}
                onPress={() => router.push('/review')}
                accessibilityRole="button"
                accessibilityLabel={t('startReview')}
                accessibilityState={{ disabled: stats.dueToday === 0 }}
                style={({ pressed }) => [
                  styles.heroBtn,
                  { backgroundColor: colors.surface, opacity: stats.dueToday === 0 ? 0.55 : pressed ? 0.88 : 1 },
                ]}
              >
                <Ionicons name="play" size={20} color={colors.primary} />
                <AppText variant="bodyStrong" color={colors.primary}>
                  {t('startReview')}
                </AppText>
              </Pressable>
            </View>
            </FadeIn>

            <FadeIn delay={160}>
            <Button
              label={t('reviseAnytime')}
              icon="shuffle"
              variant="secondary"
              accessibilityHint={t('reviseAnytimeSub')}
              onPress={() => router.push({ pathname: '/review', params: { mode: 'revise' } })}
            />
            </FadeIn>

            <FadeIn delay={240}>
              <View style={styles.statsRow}>
                <Stat label={t('tomorrow')} value={stats.dueTomorrow} icon="calendar-outline" />
                <Stat label={t('thisWeek')} value={stats.dueThisWeek} icon="calendar-number-outline" />
                <Stat label={t('mature')} value={stats.mature} icon="ribbon-outline" />
              </View>
            </FadeIn>

            <FadeIn delay={320}>
            <Pressable
              onPress={() => router.push('/library')}
              accessibilityRole="button"
              accessibilityLabel={t('addKnowledge')}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.shortcut,
                {
                  backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                  borderColor: hovered ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{t('addKnowledge')}</AppText>
                <AppText variant="caption" muted>
                  {t('addKnowledgeSub')}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
            </FadeIn>
          </>
        ) : null}
      </Screen>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  const { colors } = useSettings();
  const shown = useCountUp(value, 600);
  return (
    <Surface style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <AppText variant="heading" accessibilityLabel={`${label}: ${value}`}>
        {shown}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {label}
      </AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  hero: { borderRadius: radius.xl, padding: space.xl, gap: space.xs, alignItems: 'flex-start' },
  heroLabel: { letterSpacing: 1, opacity: 0.85 },
  heroCount: { fontSize: 64, lineHeight: 72, fontWeight: '800' },
  heroSub: { opacity: 0.9, marginBottom: space.md },
  heroBtn: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    alignSelf: 'stretch',
  },
  statsRow: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1, gap: 2, padding: space.md },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  shortcutIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
