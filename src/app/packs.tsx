import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getImportedPackIds, importPack } from '@/db/queries';
import { VOCAB_PACKS } from '@/data/vocabPacks';
import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

export default function PacksScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colors, t } = useSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [imported, setImported] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getImportedPackIds(db).then((ids) => {
        if (active) setImported(ids);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  async function handleDownload(packId: string) {
    const pack = VOCAB_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setDownloadingId(packId);
    try {
      await importPack(db, pack);
      setImported((prev) => [...prev, packId]);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing(4) }]}
    >
      <Text style={styles.subtitle}>{t('packs.subtitle')}</Text>

      {VOCAB_PACKS.map((pack) => {
        const isImported = imported.includes(pack.id);
        const isDownloading = downloadingId === pack.id;
        return (
          <View key={pack.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{pack.title}</Text>
              <Text style={styles.cardTheme}>{pack.theme}</Text>
            </View>
            <Text style={styles.cardCount}>{t('packs.wordCount', { count: pack.words.length })}</Text>
            <Pressable
              style={[styles.downloadButton, isImported && styles.downloadButtonDone]}
              onPress={() => handleDownload(pack.id)}
              disabled={isImported || isDownloading}
            >
              <Text style={[styles.downloadButtonText, isImported && styles.downloadButtonTextDone]}>
                {isImported ? t('packs.downloaded') : isDownloading ? t('packs.downloading') : t('packs.download')}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing(2.5), gap: spacing(2) },
    subtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing(0.5) },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      padding: spacing(2),
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing(1),
    },
    cardHeader: { gap: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    cardTheme: { fontSize: 13, color: colors.muted },
    cardCount: { fontSize: 12, color: colors.muted },
    downloadButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingVertical: spacing(1.25),
      alignItems: 'center',
      marginTop: spacing(0.5),
    },
    downloadButtonDone: { backgroundColor: colors.primarySoft },
    downloadButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    downloadButtonTextDone: { color: colors.primary },
  });
}
