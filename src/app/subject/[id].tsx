import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RowMenu } from '@/components/RowMenu';
import { deleteCard, listCardsBySubject } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { Card, CardStatus } from '@/types';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const STATUS_LABEL: Record<CardStatus, string> = {
    new: t('status.new'),
    learning: t('status.learning'),
    review: t('status.review'),
    mature: t('status.mature'),
  };
  const [cards, setCards] = useState<Card[]>([]);

  const loadCards = useCallback(() => {
    if (id) listCardsBySubject(db, id).then(setCards);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (id) listCardsBySubject(db, id).then((list) => active && setCards(list));
      return () => {
        active = false;
      };
    }, [db, id])
  );

  function handleDeleteCard(cardId: string) {
    Alert.alert(t('edit.deleteConfirmTitle'), t('edit.deleteConfirmBody'), [
      { text: t('edit.cancel'), style: 'cancel' },
      {
        text: t('edit.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCard(db, cardId);
          loadCards();
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListEmptyComponent={<Text style={styles.empty}>{t('subject.empty')}</Text>}
        ListHeaderComponent={
          cards.length > 0 ? (
            <Pressable
              style={styles.reviewButton}
              onPress={() => id && router.push(`/review?mode=revise&subjectId=${id}`)}
            >
              <Text style={styles.reviewButtonText}>{t('subject.reviewSubject')}</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/edit-card?id=${item.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.question}>{item.question}</Text>
              <RowMenu items={[{ label: t('edit.delete'), destructive: true, onPress: () => handleDeleteCard(item.id) }]} />
            </View>
            <Text style={styles.answer} numberOfLines={2}>
              {item.answer}
            </Text>
            <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing(2.5), gap: spacing(1.5) },
    empty: { color: colors.muted, textAlign: 'center', marginTop: spacing(4) },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing(1) },
    question: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
    answer: { fontSize: 13, color: colors.muted, marginTop: 4 },
    status: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing(1),
      textTransform: 'uppercase',
    },
    reviewButton: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      paddingVertical: spacing(1.5),
      alignItems: 'center',
    },
    reviewButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  });
}
