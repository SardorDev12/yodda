import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createBook, listBooks } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { BookWithCounts } from '@/types';

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [books, setBooks] = useState<BookWithCounts[]>([]);
  const [addingBook, setAddingBook] = useState(false);
  const [newBookName, setNewBookName] = useState('');

  const loadBooks = useCallback(() => {
    listBooks(db).then(setBooks);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listBooks(db).then((list) => {
        if (active) setBooks(list);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  async function handleCreateBook() {
    const name = newBookName.trim();
    if (!name) return;
    await createBook(db, name);
    setNewBookName('');
    setAddingBook(false);
    loadBooks();
  }

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
              <Pressable style={styles.newBookSave} onPress={handleCreateBook}>
                <Text style={styles.newBookSaveText}>{t('add.add')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addBookButton} onPress={() => setAddingBook(true)}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addBookButtonText}>{t('library.newBook')}</Text>
            </Pressable>
          )
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('library.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/book/${item.id}`)}>
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
    list: { padding: spacing(2.5), gap: spacing(1.5) },
    empty: { color: colors.muted, textAlign: 'center', marginTop: spacing(4) },
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
    },
    rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    rowSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    badge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: spacing(1), paddingVertical: 2 },
    badgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  });
}
