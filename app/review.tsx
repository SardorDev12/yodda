import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti, FadeIn, PopIn, useCountUp, usePressScale } from '@/components/motion';
import { SwipeCard, type ExitDir, type SwipeCardHandle } from '@/components/SwipeCard';
import { AppText, Button, EmptyState, ErrorState, Loading, ProgressBar } from '@/components/ui';
import { getReviewQueue, previewRating, recordReview } from '@/data/library';
import { formatInterval } from '@/lib/scheduler';
import type { Card, Rating } from '@/lib/types';
import { useDataVersion } from '@/providers/DataVersionProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useToast } from '@/providers/ToastProvider';
import { CONTENT_MAX_WIDTH, MIN_TOUCH, radius, space, type as typo } from '@/theme/tokens';

const RATINGS: Rating[] = ['again', 'hard', 'good', 'easy'];
const EXIT: Record<Rating, ExitDir> = { again: 'left', hard: 'left', good: 'right', easy: 'up' };

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
  const cardRef = useRef<SwipeCardHandle>(null);

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
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        // Fly the card away while the review is saved; advance once both are done.
        await Promise.all([recordReview(card, rating), cardRef.current?.exit(EXIT[rating])]);
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
        <Done reviewed={reviewed} onHome={() => router.replace('/')} />
        <Confetti />
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

        <ScrollView style={styles.fill} contentContainerStyle={styles.cardScroll} scrollEnabled={!busy}>
          <SwipeCard
            key={card!.id}
            ref={cardRef}
            revealed={revealed}
            onTap={() => setRevealed(true)}
            onSwipe={(dir) => rate(dir === 'right' ? 'good' : 'again')}
            leftLabel={t('again')}
            rightLabel={t('good')}
          >
            <AppText variant="caption" muted style={styles.label}>
              {(answerFirst ? t('back_side') : t('front')).toUpperCase()}
            </AppText>
            <AppText style={styles.cardText}>
              {front}
            </AppText>
            {revealed ? (
              <FadeIn distance={10} duration={300}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <AppText variant="caption" color={colors.primary} style={styles.label}>
                  {(answerFirst ? t('front') : t('back_side')).toUpperCase()}
                </AppText>
                <AppText style={styles.cardText} accessibilityLiveRegion="polite">
                  {back}
                </AppText>
              </FadeIn>
            ) : null}
          </SwipeCard>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: space.lg + insets.bottom }]}>
          {revealed ? (
            <View style={styles.ratings}>
              {RATINGS.map((r, i) => (
                <PopIn key={r} delay={i * 55} from={0.8} style={styles.ratingSlot}>
                  <RatingButton rating={r} card={card!} disabled={busy} onPress={() => rate(r)} />
                </PopIn>
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
  const press = usePressScale(0.93);
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        {...press.handlers}
        accessibilityRole="button"
        accessibilityLabel={`${t(rating)}, ${formatInterval(days)}`}
        style={({ pressed }) => [styles.rating, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }]}
      >
        <Text style={[typo.bodyStrong, { color: colors.onPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
          {t(rating)}
        </Text>
        <Text style={[typo.caption, { color: colors.onPrimary, opacity: 0.9 }]}>{formatInterval(days)}</Text>
      </Pressable>
    </Animated.View>
  );
}

function Done({ reviewed, onHome }: { reviewed: number; onHome: () => void }) {
  const { t, plural, colors } = useSettings();
  const n = useCountUp(reviewed, 900);
  return (
    <View style={styles.done}>
      <PopIn from={0.3}>
        <View style={[styles.trophy, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="trophy" size={44} color={colors.primary} />
        </View>
      </PopIn>
      <FadeIn delay={200}>
        <AppText variant="title" style={styles.centerText} accessibilityRole="header">
          {t('sessionComplete')}
        </AppText>
      </FadeIn>
      <FadeIn delay={320}>
        <AppText style={styles.bigNumber} color={colors.primary} accessibilityLabel={plural('reviewedCount', reviewed)}>
          {n}
        </AppText>
        <AppText muted style={styles.centerText}>
          {plural('reviewedCount', reviewed).replace(String(reviewed), '').trim()}
        </AppText>
      </FadeIn>
      <FadeIn delay={460} style={styles.doneBtn}>
        <Button label={t('backHome')} onPress={onHome} />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  progress: { padding: space.lg, gap: space.xs },
  progressText: { textAlign: 'right' },
  cardScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  label: { letterSpacing: 1 },
  cardText: { fontSize: 22, lineHeight: 32, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: space.md },
  footer: { padding: space.lg, gap: space.sm },
  ratings: { flexDirection: 'row', gap: space.sm },
  ratingSlot: { flex: 1 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.xl },
  trophy: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  bigNumber: { fontSize: 72, lineHeight: 80, fontWeight: '800', textAlign: 'center' },
  doneBtn: { alignSelf: 'stretch', minWidth: 240 },
  rating: {
    minHeight: MIN_TOUCH + 16,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  hint: { textAlign: 'center' },
});
