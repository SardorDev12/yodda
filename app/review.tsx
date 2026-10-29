import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, EmptyState, ErrorState, Loading, ProgressBar, Surface } from '@/components/ui';
import { getReviewQueue, previewRating, recordReview } from '@/data/library';
import { formatInterval } from '@/lib/scheduler';
import type { Card, Rating } from '@/lib/types';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';
import { CONTENT_MAX_WIDTH, MIN_TOUCH, radius, space, type as typo } from '@/theme/tokens';

const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];

export default function ReviewScreen() {
  const { mode, subjectId, bookId } = useLocalSearchParams<{ mode?: string; subjectId?: string; bookId?: string }>();
  const revise = mode === 'revise';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, plural, colors, settings } = useSettings();
  const toast = useToast();
  const { bump } = useDataVersion();

  const [queue, setQueue] = useState<Card[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  // The queue is fixed for the session; realtime refetches must not reshuffle it mid-review.
  const load = useCallback(() => {
    setQueue(null);
    setLoadError(null);
    getReviewQueue({ mode: revise ? 'revise' : 'due', subjectId, bookId })
      .then(setQueue)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, [revise, subjectId, bookId]);
  useEffect(load, [load]);

  const card = queue?.[index];
  const done = !!queue && queue.length > 0 && index >= queue.length;

  const rate = useCallback(
    async (rating: Rating) => {
      if (!card || busy) return;
      setBusy(true);
      try {
        await recordReview(card, rating);
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        setReviewed((n) => n + 1);
        setRevealed(false);
        setIndex((i) => i + 1);
        bump();
      } catch {
        toast(t('genericError'), 'error');
      } finally {
        setBusy(false);
      }
    },
    [card, busy, bump, toast, t],
  );

  // Web keyboard shortcuts: Space/Enter reveals, 1–4 rates.
  const stateRef = useRef({ revealed, card, rate });
  stateRef.current = { revealed, card, rate };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.card || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!s.revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (s.revealed && ['1', '2', '3', '4'].includes(e.key)) {
        s.rate(RATINGS[Number(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const title = revise ? t('revision') : t('review');
  const header = <Stack.Screen options={{ title }} />;

  if (loadError) return <>{header}<ErrorState message={loadError} onRetry={load} /></>;
  if (!queue) return <>{header}<Loading /></>;

  if (queue.length === 0) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState
          icon={revise ? 'albums-outline' : 'checkmark-circle-outline'}
          title={revise ? t('nothingToRevise') : t('nothingDue')}
          body={revise ? t('nothingToReviseSub') : t('nothingDueSub')}
          action={<Button label={t('backHome')} onPress={() => router.replace('/')} />}
        />
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg }]}>
        {header}
        <EmptyState
          icon="trophy-outline"
          title={t('sessionComplete')}
          body={plural('reviewedCount', reviewed)}
          action={<Button label={t('backHome')} onPress={() => router.replace('/')} />}
        />
      </View>
    );
  }

  const answerFirst = settings.reviewOrder === 'answer';
  const front = answerFirst ? card!.answer : card!.question;
  const back = answerFirst ? card!.question : card!.answer;

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      {header}
      <View style={styles.center}>
        <View style={styles.progress}>
          <ProgressBar value={index / queue.length} />
          <AppText variant="caption" muted style={styles.progressText}>
            {t('progress', { i: index + 1, n: queue.length })}
          </AppText>
        </View>

        <ScrollView style={styles.fill} contentContainerStyle={styles.cardScroll}>
          <Surface style={styles.card}>
            <AppText variant="caption" muted style={styles.label}>
              {(answerFirst ? t('back_side') : t('front')).toUpperCase()}
            </AppText>
            <AppText style={styles.cardText} selectable>
              {front}
            </AppText>
            {revealed ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <AppText variant="caption" color={colors.primary} style={styles.label}>
                  {(answerFirst ? t('front') : t('back_side')).toUpperCase()}
                </AppText>
                <AppText style={styles.cardText} selectable accessibilityLiveRegion="polite">
                  {back}
                </AppText>
              </>
            ) : null}
          </Surface>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>
          {revealed ? (
            <View style={styles.ratings}>
              {RATINGS.map((r) => (
                <RatingButton key={r} rating={r} card={card!} disabled={busy} onPress={() => rate(r)} />
              ))}
            </View>
          ) : (
            <Button label={t('showAnswer')} icon="eye-outline" onPress={() => setRevealed(true)} />
          )}
          {Platform.OS === 'web' ? (
            <AppText variant="caption" muted style={styles.hint}>
              {t('keyboardHint')}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function RatingButton({
  rating,
  card,
  disabled,
  onPress,
}: {
  rating: Rating;
  card: Card;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t, colors } = useSettings();
  const bg = { again: colors.danger, hard: colors.warning, good: colors.primary, easy: colors.success }[rating];
  const days = previewRating(card, rating).intervalDays;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${t(rating)}, ${formatInterval(days)}`}
      style={({ pressed }) => [styles.rating, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      <Text style={[typo.bodyStrong, { color: colors.onPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {t(rating)}
      </Text>
      <Text style={[typo.caption, { color: colors.onPrimary, opacity: 0.9 }]}>{formatInterval(days)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  progress: { padding: space.lg, gap: space.xs },
  progressText: { textAlign: 'right' },
  cardScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  card: { minHeight: 220, justifyContent: 'center', padding: space.xl, borderRadius: radius.xl },
  label: { letterSpacing: 1 },
  cardText: { fontSize: 22, lineHeight: 32, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: space.sm },
  footer: { padding: space.lg, gap: space.sm },
  ratings: { flexDirection: 'row', gap: space.sm },
  rating: {
    flex: 1,
    minHeight: MIN_TOUCH + 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  hint: { textAlign: 'center' },
});
