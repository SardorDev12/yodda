import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '@/store/settings-context';
import { radius, spacing, type ThemeColors } from '@/theme';

/**
 * Every screen now waits on a network round-trip for its first paint
 * (there's no local database to read instantly), so a bare loading state
 * is as important as the content itself — without it, a slow connection
 * just shows "0 due" / "no books yet" for a moment, which reads as wrong
 * data, not as loading.
 */
export function LoadingState() {
  const { colors } = useSettings();
  return (
    <View style={styles(colors).center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors, t } = useSettings();
  const s = styles(colors);
  return (
    <View style={s.center}>
      <Text style={s.message}>{message}</Text>
      <Pressable style={s.retryButton} onPress={onRetry}>
        <Text style={s.retryText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

/** An icon + message for an empty list — reads as "nothing here yet, by
 * design" rather than a bare line of gray text, which can look broken. */
export function EmptyState({ icon, message }: { icon: ComponentProps<typeof Ionicons>['name']; message: string }) {
  const { colors } = useSettings();
  const s = styles(colors);
  return (
    <View style={s.emptyWrap}>
      <Ionicons name={icon} size={32} color={colors.border} />
      <Text style={s.message}>{message}</Text>
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(3), gap: spacing(1.5) },
    emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(5), gap: spacing(1) },
    message: { color: colors.muted, textAlign: 'center', fontSize: 14 },
    retryButton: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, paddingVertical: spacing(1), paddingHorizontal: spacing(2.5) },
    retryText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  });
