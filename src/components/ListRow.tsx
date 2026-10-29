import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { MIN_TOUCH, radius, space } from '@/theme/tokens';
import { AppText, type IconName } from './ui';

/** Tappable list row: icon tile, title/subtitle, optional meta and trailing actions. */
export function ListRow({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  trailing,
  titleLines = 1,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  onPress: () => void;
  trailing?: ReactNode;
  titleLines?: number;
}) {
  const { colors } = useSettings();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.main,
          { backgroundColor: pressed ? colors.surfaceAlt : hovered ? colors.bg : 'transparent' },
        ]}
      >
        {icon ? (
          <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon} size={22} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={titleLines}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" muted numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
          {meta ? <View style={styles.meta}>{meta}</View> : null}
        </View>
        {!trailing ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
      </Pressable>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  main: {
    flex: 1,
    minHeight: MIN_TOUCH + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  icon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  trailing: { paddingRight: space.xs },
});
