import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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

import { EmptyState, ErrorState, LoadingState } from '@/components/CenterState';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RenameModal } from '@/components/RenameModal';
import { RowMenu } from '@/components/RowMenu';
import { ScreenHeader } from '@/components/ScreenHeader';
import { createCard, deleteSubject, getSubject, listCardsBySubject, updateSubject } from '@/db/queries';
import { useUserId } from '@/store/auth-context';
import { useDataVersion } from '@/store/data-context';
import { useSettings } from '@/store/settings-context';
import { contentMaxWidth, radius, shadow, spacing, type ThemeColors } from '@/theme';
import type { Card, CardStatus, Subject } from '@/types';

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = useUserId();
  const version = useDataVersion();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCards = useCallback(() => {
    if (id) return listCardsBySubject(userId, id).then(setCards);
  }, [userId, id]);

  const load = useCallback(() => {
    if (!id) return;
    setError(false);
    Promise.all([getSubject(userId, id), listCardsBySubject(userId, id)])
      .then(([s, list]) => {
        setSubject(s);
        setCards(list);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId, id]);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- version triggers a refetch on realtime pushes
    }, [load, version])
  );

  async function handleCreateCard() {
    if (!id || !question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await createCard(userId, { subjectId: id, question, answer });
      setQuestion('');
      setAnswer('');
      setAddingCard(false);
      await loadCards();
    } catch {
      Alert.alert(t('subject.newCard'), t('common.loadError'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteUnit() {
    if (!id) return;
    try {
      await deleteSubject(userId, id);
      router.back();
    } catch {
      Alert.alert(t('book.deleteUnit'), t('common.loadError'));
    }
  }

  async function handleRename(name: string) {
    if (!id) return;
    try {
      await updateSubject(userId, id, name);
      setRenaming(false);
      load();
    } catch {
      Alert.alert(t('book.renameUnit'), t('common.loadError'));
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={t('common.loadError')} onRetry={load} />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={subject?.name ?? t('subject.title')}
        right={
          <RowMenu
            items={[
              { label: t('common.edit'), icon: 'create-outline', onPress: () => setRenaming(true) },
              {
                label: t('book.deleteUnit'),
                icon: 'trash-outline',
                destructive: true,
                onPress: () => setDeleting(true),
              },
            ]}
          />
        }
      />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListEmptyComponent={<EmptyState icon="card-outline" message={t('subject.empty')} />}
        ListHeaderComponent={
          <View style={styles.headerGap}>
            {cards.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.reviewButton, pressed && styles.pressedDim]}
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
                  <Pressable
                    style={({ pressed }) => [styles.newCardCancel, pressed && styles.pressedDim]}
                    onPress={() => setAddingCard(false)}
                  >
                    <Text style={styles.newCardCancelText}>{t('common.cancel')}</Text>
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
              <Pressable
                style={({ pressed }) => [styles.addCardButton, pressed && styles.pressedDim]}
                onPress={() => setAddingCard(true)}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addCardButtonText}>{t('subject.newCard')}</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressedDim]}
            onPress={() => router.push(`/edit-card?id=${item.id}`)}
          >
            <Text style={styles.question}>{item.question}</Text>
            <Text style={styles.answer} numberOfLines={2}>
              {item.answer}
            </Text>
            <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
          </Pressable>
        )}
      />
      <RenameModal
        visible={renaming}
        title={t('book.renameUnit')}
        initialValue={subject?.name ?? ''}
        placeholder={t('book.unitNamePlaceholder')}
        onCancel={() => setRenaming(false)}
        onSave={handleRename}
      />
      <ConfirmModal
        visible={deleting}
        title={t('book.deleteUnitConfirmTitle')}
        body={t('book.deleteUnitConfirmBody')}
        confirmLabel={t('book.deleteUnit')}
        onCancel={() => setDeleting(false)}
        onConfirm={confirmDeleteUnit}
      />
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing(2.5), gap: spacing(1.5), width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    pressedDim: { opacity: 0.7 },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
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
