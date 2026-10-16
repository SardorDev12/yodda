import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/CenterState';
import { getDueCards, getRevisionCards, getRevisionCardsByBook, recordReview } from '@/db/queries';
import { useUserId } from '@/store/auth-context';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { Card, Rating } from '@/types';

export default function ReviewScreen() {
  const userId = useUserId();
  const router = useRouter();
  const { mode, subjectId, bookId } = useLocalSearchParams<{ mode?: string; subjectId?: string; bookId?: string }>();
  const isRevision = mode === 'revise';
  const { colors, reviewOrder, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const RATINGS: { key: Rating; label: string; color: string }[] = useMemo(
    () => [
      { key: 'again', label: t('review.again'), color: colors.danger },
      { key: 'hard', label: t('review.hard'), color: colors.warning },
      { key: 'good', label: t('review.good'), color: colors.primary },
      { key: 'easy', label: t('review.easy'), color: colors.success },
    ],
    [colors, t]
  );
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const result = !isRevision
      ? getDueCards(userId)
      : bookId
        ? getRevisionCardsByBook(userId, bookId)
        : getRevisionCards(userId, subjectId);
    result
      .then((list) => {
        setQueue(list);
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  };

  useEffect(load, [userId, isRevision, subjectId, bookId]);

  const current = queue?.[index];
  const front = reviewOrder === 'answer' ? current?.answer : current?.question;
  const back = reviewOrder === 'answer' ? current?.question : current?.answer;

  async function handleRate(rating: Rating) {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      await recordReview(userId, current, rating);
      setReviewedCount((n) => n + 1);
      setRevealed(false);
      setIndex((i) => i + 1);
    } catch {
      Alert.alert(t('review.showAnswer'), t('common.loadError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.root}>
        <ErrorState message={t('common.loadError')} onRetry={load} />
      </SafeAreaView>
    );
  }

  if (queue === null) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.muted}>{t('review.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.doneTitle}>{t('review.allDone')}</Text>
          <Text style={styles.muted}>
            {reviewedCount > 0
              ? t('review.reviewedCount', { count: reviewedCount })
              : t(isRevision ? 'review.nothingToRevise' : 'review.nothingDue')}
          </Text>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>{t('review.backHome')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
        <Text style={styles.progress}>
          {index + 1} / {queue.length}
        </Text>
      </View>

      <View style={styles.cardArea}>
        <Text style={styles.question}>{front}</Text>

        {revealed && (
          <View style={styles.answerBox}>
            <View style={styles.divider} />
            <Text style={styles.answer}>{back}</Text>
          </View>
        )}
      </View>

      {!revealed ? (
        <Pressable style={styles.showButton} onPress={() => setRevealed(true)}>
          <Text style={styles.showButtonText}>{t('review.showAnswer')}</Text>
        </Pressable>
      ) : (
        <View style={styles.ratingRow}>
          {RATINGS.map((r) => (
            <Pressable
              key={r.key}
              style={[styles.ratingButton, { borderColor: r.color }, submitting && styles.ratingButtonDisabled]}
              disabled={submitting}
              onPress={() => handleRate(r.key)}
            >
              <Text style={[styles.ratingText, { color: r.color }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1), padding: spacing(3) },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing(2.5),
      paddingTop: spacing(2),
    },
    progress: { color: colors.muted, fontWeight: '600' },
    cardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(3) },
    question: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
    answerBox: { marginTop: spacing(3), alignItems: 'center' },
    divider: { width: 48, height: 2, backgroundColor: colors.border, marginBottom: spacing(3) },
    answer: { fontSize: 18, color: colors.text, textAlign: 'center', lineHeight: 26 },
    showButton: {
      margin: spacing(3),
      backgroundColor: colors.primarySoft,
      paddingVertical: spacing(2),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    showButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
    ratingRow: { flexDirection: 'row', gap: spacing(1), margin: spacing(2), marginBottom: spacing(4) },
    ratingButton: {
      flex: 1,
      paddingVertical: spacing(2),
      borderRadius: radius.md,
      borderWidth: 1.5,
      alignItems: 'center',
    },
    ratingButtonDisabled: { opacity: 0.5 },
    ratingText: { fontWeight: '700' },
    muted: { color: colors.muted, textAlign: 'center' },
    doneTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    closeButton: {
      marginTop: spacing(2),
      backgroundColor: colors.primary,
      paddingVertical: spacing(1.5),
      paddingHorizontal: spacing(4),
      borderRadius: radius.md,
    },
    closeButtonText: { color: '#fff', fontWeight: '700' },
  });
}
