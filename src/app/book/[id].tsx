import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createSubject, deleteSubject, listSubjects } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { SubjectWithCounts } from '@/types';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [units, setUnits] = useState<SubjectWithCounts[]>([]);
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  const loadUnits = useCallback(() => {
    if (id) listSubjects(db, id).then(setUnits);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (id) listSubjects(db, id).then((list) => active && setUnits(list));
      return () => {
        active = false;
      };
    }, [db, id])
  );

  async function handleCreateUnit() {
    const name = newUnitName.trim();
    if (!name || !id) return;
    await createSubject(db, id, name);
    setNewUnitName('');
    setAddingUnit(false);
    loadUnits();
  }

  function handleDeleteUnit(unitId: string) {
    Alert.alert(t('book.deleteUnitConfirmTitle'), t('book.deleteUnitConfirmBody'), [
      { text: t('edit.cancel'), style: 'cancel' },
      {
        text: t('book.deleteUnit'),
        style: 'destructive',
        onPress: async () => {
          await deleteSubject(db, unitId);
          loadUnits();
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={units}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListHeaderComponent={
          <View style={styles.headerGap}>
            {units.length > 0 && (
              <Pressable style={styles.reviewButton} onPress={() => id && router.push(`/review?mode=revise&bookId=${id}`)}>
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
                <Pressable style={styles.newUnitSave} onPress={handleCreateUnit}>
                  <Text style={styles.newUnitSaveText}>{t('add.add')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.addUnitButton} onPress={() => setAddingUnit(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addUnitButtonText}>{t('book.newUnit')}</Text>
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('book.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/subject/${item.id}`)}>
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
              <Pressable hitSlop={8} onPress={() => handleDeleteUnit(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
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
    },
    rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    rowSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    badge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: spacing(1), paddingVertical: 2 },
    badgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  });
}
