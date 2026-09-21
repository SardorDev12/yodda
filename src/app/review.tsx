import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDueCards, recordReview } from '@/db/queries';
import { pushCard } from '@/lib/sync';
import { useAuth } from '@/store/auth-context';
import { colors, radius, spacing } from '@/theme';
import type { Card, Rating } from '@/types';

const RATINGS: { key: Rating; label: string; color: string }[] = [
  { key: 'again', label: 'Again', color: colors.danger },
  { key: 'hard', label: 'Hard', color: colors.warning },
  { key: 'good', label: 'Good', color: colors.primary },
  { key: 'easy', label: 'Easy', color: colors.success },
];

export default function ReviewScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { user } = useAuth();
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    getDueCards(db).then(setQueue);
  }, [db]);

  const current = queue?.[index];

  async function handleRate(rating: Rating) {
    if (!current) return;
    const updated = await recordReview(db, current, rating);
    if (user) pushCard(updated, user.id).catch(() => {});
    setReviewedCount((n) => n + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  if (queue === null) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.doneTitle}>All done</Text>
          <Text style={styles.muted}>
            {reviewedCount > 0 ? `You reviewed ${reviewedCount} item${reviewedCount === 1 ? '' : 's'}.` : 'Nothing was due right now.'}
          </Text>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Back to Home</Text>
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
        <Text style={styles.question}>{current.question}</Text>

        {revealed && (
          <View style={styles.answerBox}>
            <View style={styles.divider} />
            <Text style={styles.answer}>{current.answer}</Text>
          </View>
        )}
      </View>

      {!revealed ? (
        <Pressable style={styles.showButton} onPress={() => setRevealed(true)}>
          <Text style={styles.showButtonText}>Show answer</Text>
        </Pressable>
      ) : (
        <View style={styles.ratingRow}>
          {RATINGS.map((r) => (
            <Pressable key={r.key} style={[styles.ratingButton, { borderColor: r.color }]} onPress={() => handleRate(r.key)}>
              <Text style={[styles.ratingText, { color: r.color }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
