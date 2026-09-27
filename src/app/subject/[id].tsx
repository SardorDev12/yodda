import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RowMenu } from '@/components/RowMenu';
import { createCard, deleteCard, deleteSubject, getSubject, listCardsBySubject } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { Card, CardStatus, Subject } from '@/types';

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
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [addingCard, setAddingCard] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCards = useCallback(() => {
    if (id) listCardsBySubject(db, id).then(setCards);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (id) {
        getSubject(db, id).then((s) => active && setSubject(s));
        listCardsBySubject(db, id).then((list) => active && setCards(list));
      }
      return () => {
        active = false;
      };
    }, [db, id])
  );

  async function handleCreateCard() {
    if (!id || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await createCard(db, { subjectId: id, question, answer });
      setQuestion('');
      setAnswer('');
      setAddingCard(false);
      loadCards();
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteUnit() {
    if (!id) return;
    Alert.alert(t('book.deleteUnitConfirmTitle'), t('book.deleteUnitConfirmBody'), [
      { text: t('edit.cancel'), style: 'cancel' },
      {
        text: t('book.deleteUnit'),
        style: 'destructive',
        onPress: async () => {
          await deleteSubject(db, id);
          router.back();
        },
      },
    ]);
  }

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
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen
        options={{
          title: subject?.name ?? t('subject.title'),
          headerRight: () => (
            <RowMenu items={[{ label: t('book.deleteUnit'), destructive: true, onPress: handleDeleteUnit }]} />
          ),
        }}
      />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListEmptyComponent={<Text style={styles.empty}>{t('subject.empty')}</Text>}
        ListHeaderComponent={
          <View style={styles.headerGap}>
            {cards.length > 0 && (
              <Pressable
                style={styles.reviewButton}
                onPress={() => id && router.push(`/review?mode=revise&subjectId=${id}`)}
              >
                <Text style={styles.reviewButtonText}>{t('subject.reviewSubject')}</Text>
              </Pressable>
            )}

            {addingCard ? (
              <View style={styles.newCardForm}>
                <TextInput
                  style={styles.input}
                  placeholder={t('add.questionPlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={question}
                  onChangeText={setQuestion}
                  multiline
                />
                <TextInput
                  style={[styles.input, styles.inputTall]}
                  placeholder={t('add.answerPlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                />
                <View style={styles.newCardActions}>
                  <Pressable style={styles.newCardCancel} onPress={() => setAddingCard(false)}>
                    <Text style={styles.newCardCancelText}>{t('edit.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.newCardSave, (!question.trim() || !answer.trim()) && styles.newCardSaveDisabled]}
                    disabled={!question.trim() || !answer.trim() || saving}
                    onPress={handleCreateCard}
                  >
                    <Text style={styles.newCardSaveText}>{saving ? t('add.saving') : t('add.save')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addCardButton} onPress={() => setAddingCard(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addCardButtonText}>{t('subject.newCard')}</Text>
              </Pressable>
            )}
          </View>
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
    </KeyboardAvoidingView>
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
    headerGap: { gap: spacing(1.5) },
    addCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(0.5),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      paddingVertical: spacing(1.5),
    },
    addCardButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    newCardForm: { gap: spacing(1) },
    input: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
      fontSize: 15,
      color: colors.text,
    },
    inputTall: { minHeight: 80, textAlignVertical: 'top' },
    newCardActions: { flexDirection: 'row', gap: spacing(1) },
    newCardCancel: {
      flex: 1,
      paddingVertical: spacing(1.25),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    newCardCancelText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
    newCardSave: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing(1.25),
      borderRadius: radius.md,
      alignItems: 'center',
    },
    newCardSaveDisabled: { backgroundColor: colors.border },
    newCardSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
