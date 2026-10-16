import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/CenterState';
import { RowMenu } from '@/components/RowMenu';
import { createSubject, deleteBook, getBook, listSubjects } from '@/db/queries';
import { useUserId } from '@/store/auth-context';
import { useDataVersion } from '@/store/data-context';
import { useSettings } from '@/store/settings-context';
import { contentMaxWidth, radius, shadow, spacing, type ThemeColors } from '@/theme';
import type { Book, SubjectWithCounts } from '@/types';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const version = useDataVersion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [book, setBook] = useState<Book | null>(null);
  const [units, setUnits] = useState<SubjectWithCounts[]>([]);
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setError(false);
    Promise.all([getBook(userId, id), listSubjects(userId, id)])
      .then(([b, list]) => {
        setBook(b);
        setUnits(list);
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

  async function handleCreateUnit() {
    const name = newUnitName.trim();
    if (!name || !id) return;
    setSaving(true);
    try {
      await createSubject(userId, id, name);
      setNewUnitName('');
      setAddingUnit(false);
      load();
    } catch {
      Alert.alert(t('book.newUnit'), t('common.loadError'));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteBook() {
    if (!id) return;
    Alert.alert(t('library.deleteBookConfirmTitle'), t('library.deleteBookConfirmBody'), [
      { text: t('edit.cancel'), style: 'cancel' },
      {
        text: t('library.deleteBook'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBook(userId, id);
            router.back();
          } catch {
            Alert.alert(t('library.deleteBook'), t('common.loadError'));
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={t('common.loadError')} onRetry={load} />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen
        options={{
          title: book?.name ?? t('book.title'),
          headerRight: () => (
            <RowMenu items={[{ label: t('library.deleteBook'), destructive: true, onPress: handleDeleteBook }]} />
          ),
        }}
      />
      <FlatList
        data={units}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListHeaderComponent={
          <View style={styles.headerGap}>
            {units.length > 0 && (
              <Pressable
                style={({ pressed }) => [styles.reviewButton, pressed && styles.pressedDim]}
                onPress={() => id && router.push(`/review?mode=revise&bookId=${id}`)}
              >
                <Text style={styles.reviewButtonText}>{t('book.reviewBook')}</Text>
              </Pressable>
            )}
            {addingUnit ? (
              <View style={styles.newUnitRow}>
                <TextInput
                  style={styles.newUnitInput}
                  placeholder={t('book.unitNamePlaceholder')}
                  placeholderTextColor={colors.muted}
                  value={newUnitName}
                  onChangeText={setNewUnitName}
                  autoFocus
                  onSubmitEditing={handleCreateUnit}
                />
                <Pressable
                  style={[styles.newUnitSave, (saving || !newUnitName.trim()) && styles.newUnitSaveDisabled]}
                  onPress={handleCreateUnit}
                  disabled={saving || !newUnitName.trim()}
                >
                  <Text style={styles.newUnitSaveText}>{saving ? t('add.saving') : t('add.add')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.addUnitButton, pressed && styles.pressedDim]}
                onPress={() => setAddingUnit(true)}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addUnitButtonText}>{t('book.newUnit')}</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={<EmptyState icon="file-tray-outline" message={t('book.empty')} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressedDim]}
            onPress={() => router.push(`/subject/${item.id}`)}
          >
            <View>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {t('library.cardCount', { count: item.totalCards })} · {t('library.newCount', { count: item.newCards })}
              </Text>
            </View>
            <View style={styles.rowRight}>
              {item.dueToday > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.dueToday}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Pressable>
        )}
      />
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing(2.5), gap: spacing(1.5), width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    pressedDim: { opacity: 0.7 },
    addUnitButton: {
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
    addUnitButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    headerGap: { gap: spacing(1.5) },
    reviewButton: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      paddingVertical: spacing(1.5),
      alignItems: 'center',
    },
    reviewButtonText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
    newUnitRow: { flexDirection: 'row', gap: spacing(1) },
    newUnitInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
      color: colors.text,
    },
    newUnitSave: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing(2),
      justifyContent: 'center',
    },
    newUnitSaveDisabled: { backgroundColor: colors.border },
    newUnitSaveText: { color: '#fff', fontWeight: '700' },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    rowSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    badge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: spacing(1), paddingVertical: 2 },
    badgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  });
}
