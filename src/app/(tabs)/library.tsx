import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/CenterState';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RenameModal } from '@/components/RenameModal';
import { RowMenu } from '@/components/RowMenu';
import { createBook, deleteBook, listBooks, updateBook } from '@/db/queries';
import { useUserId } from '@/store/auth-context';
import { useDataVersion } from '@/store/data-context';
import { useSettings } from '@/store/settings-context';
import { contentMaxWidth, radius, shadow, spacing, type ThemeColors } from '@/theme';
import type { BookWithCounts } from '@/types';

export default function LibraryScreen() {
  const userId = useUserId();
  const version = useDataVersion();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [addingBook, setAddingBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [renamingBook, setRenamingBook] = useState<BookWithCounts | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookWithCounts | null>(null);

  const loadBooks = useCallback(() => {
    return listBooks(userId)
      .then((list) => {
        setBooks(list);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- version triggers a refetch on realtime pushes
    }, [loadBooks, version])
  );

  async function handleCreateBook() {
    const name = newBookName.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createBook(userId, name);
      setNewBookName('');
      setAddingBook(false);
      await loadBooks();
    } catch {
      Alert.alert(t('library.newBook'), t('common.loadError'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteBook() {
    if (!deletingBook) return;
    try {
      await deleteBook(userId, deletingBook.id);
      setDeletingBook(null);
      await loadBooks();
    } catch {
      Alert.alert(t('library.deleteBook'), t('common.loadError'));
    }
  }

  async function handleRenameBook(name: string) {
    if (!renamingBook) return;
    try {
      await updateBook(userId, renamingBook.id, name);
      setRenamingBook(null);
      await loadBooks();
    } catch {
      Alert.alert(t('library.renameBook'), t('common.loadError'));
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={t('common.loadError')} onRetry={loadBooks} />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListHeaderComponent={
          addingBook ? (
            <View style={styles.newBookRow}>
              <TextInput
                style={styles.newBookInput}
                placeholder={t('library.bookNamePlaceholder')}
                placeholderTextColor={colors.muted}
                value={newBookName}
                onChangeText={setNewBookName}
                autoFocus
                onSubmitEditing={handleCreateBook}
              />
              <Pressable
                style={[styles.newBookSave, (saving || !newBookName.trim()) && styles.newBookSaveDisabled]}
                onPress={handleCreateBook}
                disabled={saving || !newBookName.trim()}
              >
                <Text style={styles.newBookSaveText}>{saving ? t('add.saving') : t('add.add')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.addBookButton, pressed && styles.pressedDim]}
              onPress={() => setAddingBook(true)}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addBookButtonText}>{t('library.newBook')}</Text>
            </Pressable>
          )
        }
        ListEmptyComponent={<EmptyState icon="library-outline" message={t('library.empty')} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressedDim]}
            onPress={() => router.push(`/book/${item.id}`)}
          >
            <View>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {t('library.unitCount', { count: item.unitCount })} · {t('library.cardCount', { count: item.totalCards })}
              </Text>
            </View>
            <View style={styles.rowRight}>
              {item.dueToday > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.dueToday}</Text>
                </View>
              )}
              <RowMenu
                items={[
                  { label: t('common.edit'), icon: 'create-outline', onPress: () => setRenamingBook(item) },
                  {
                    label: t('library.deleteBook'),
                    icon: 'trash-outline',
                    destructive: true,
                    onPress: () => setDeletingBook(item),
                  },
                ]}
              />
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          </Pressable>
        )}
      />
      <RenameModal
        visible={!!renamingBook}
        title={t('library.renameBook')}
        initialValue={renamingBook?.name ?? ''}
        placeholder={t('library.bookNamePlaceholder')}
        onCancel={() => setRenamingBook(null)}
        onSave={handleRenameBook}
      />
      <ConfirmModal
        visible={!!deletingBook}
        title={t('library.deleteBookConfirmTitle')}
        body={t('library.deleteBookConfirmBody')}
        confirmLabel={t('library.deleteBook')}
        onCancel={() => setDeletingBook(null)}
        onConfirm={confirmDeleteBook}
      />
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing(2.5), gap: spacing(1.5), width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
    pressedDim: { opacity: 0.7 },
    addBookButton: {
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
    addBookButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
    newBookRow: { flexDirection: 'row', gap: spacing(1) },
    newBookInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing(1.5),
      color: colors.text,
    },
    newBookSave: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing(2),
      justifyContent: 'center',
    },
    newBookSaveDisabled: { backgroundColor: colors.border },
    newBookSaveText: { color: '#fff', fontWeight: '700' },
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
