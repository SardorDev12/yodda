import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { listSubjects } from '@/db/queries';
import { colors, radius, spacing } from '@/theme';
import type { SubjectWithCounts } from '@/types';

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listSubjects(db).then((list) => {
        if (active) setSubjects(list);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Library</Text>
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No knowledge yet. Add your first item from Home.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/subject/${item.id}`)}>
            <View>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {item.totalCards} card{item.totalCards === 1 ? '' : 's'} · {item.newCards} new
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: spacing(8) },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing(2.5) },
  list: { padding: spacing(2.5), gap: spacing(1.5) },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing(4) },
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
