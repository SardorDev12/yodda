import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/store/settings-context';
import { contentMaxWidth, spacing } from '@/theme';

/**
 * Replaces the native Stack header on screens that need a trailing action
 * (RowMenu) — the native header is edge-to-edge even when the page body is
 * capped at contentMaxWidth, so on a wide viewport the back button and menu
 * end up pinned to the browser edges instead of lining up with the content
 * column below them. This renders a full-width bar (so the background still
 * reaches the edges) with an inner row capped and centered the same way.
 */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useSettings();

  return (
    <View style={[styles.bar, { backgroundColor: colors.bg, borderBottomColor: colors.border, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.side, styles.sideLeft]}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.side, styles.sideRight]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { width: '100%', borderBottomWidth: StyleSheet.hairlineWidth },
  inner: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing(1),
  },
  side: { minWidth: 40, justifyContent: 'center' },
  sideLeft: { alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
});
