import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCardsBySubject } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { Card, CardStatus } from '@/types';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (id) listCardsBySubject(db, id).then((list) => active && setCards(list));
      return () => {
        active = false;
      };
    }, [db, id])
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListEmptyComponent={<Text style={styles.empty}>{t('subject.empty')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer} numberOfLines={2}>
              {item.answer}
            </Text>
            <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
          </View>
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
    question: { fontSize: 15, fontWeight: '600', color: colors.text },
    answer: { fontSize: 13, color: colors.muted, marginTop: 4 },
    status: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      marginTop: spacing(1),
      textTransform: 'uppercase',
    },
  });
}
