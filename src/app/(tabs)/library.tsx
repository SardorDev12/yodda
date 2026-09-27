import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listSubjects } from '@/db/queries';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';
import type { SubjectWithCounts } from '@/types';

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing(4) }]}
        ListHeaderComponent={
          <Pressable style={styles.packsLink} onPress={() => router.push('/packs')}>
            <Text style={styles.packsLinkText}>{t('library.browsePacks')}</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('library.empty')}</Text>}
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
    packsLink: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      padding: spacing(1.5),
      alignItems: 'center',
    },
    packsLinkText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
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
