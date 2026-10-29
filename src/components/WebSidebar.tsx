import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { MIN_TOUCH, radius, space } from '@/theme/tokens';
import { AppText, type IconName } from './ui';

const ITEMS: { path: '/' | '/library' | '/settings'; icon: IconName; label: 'tabHome' | 'tabLibrary' | 'tabSettings' }[] = [
  { path: '/', icon: 'home-outline', label: 'tabHome' },
  { path: '/library', icon: 'library-outline', label: 'tabLibrary' },
  { path: '/settings', icon: 'settings-outline', label: 'tabSettings' },
];

/**
 * Web-only nav rail rendered at the root layout. Uses Pressable + router.push() rather than
 * Link/asChild, which crashes on array-style props in react-native-web.
 */
export function WebSidebar() {
  const { colors, t } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null);
  if (Platform.OS !== 'web') return null;

  const collapsed = userCollapsed ?? width < 900;
  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

  return (
    <View
      accessibilityRole="navigation"
      accessibilityLabel={t('mainNav')}
      style={[styles.rail, { width: collapsed ? 72 : 232, backgroundColor: colors.surface, borderRightColor: colors.border }]}
    >
      <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="albums" size={20} color={colors.onPrimary} />
        </View>
        {!collapsed ? (
          <AppText variant="heading" style={styles.brandText}>
            {t('appName')}
          </AppText>
        ) : null}
      </View>

      <View style={styles.items}>
        {ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path)}
              accessibilityRole="link"
              accessibilityLabel={t(item.label)}
              accessibilityState={{ selected: active }}
              style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                styles.item,
                collapsed && styles.itemCollapsed,
                { backgroundColor: active ? colors.primarySoft : hovered ? colors.surfaceAlt : 'transparent' },
              ]}
            >
              <Ionicons
                name={active ? (item.icon.replace('-outline', '') as IconName) : item.icon}
                size={22}
                color={active ? colors.primary : colors.textMuted}
              />
              {!collapsed ? (
                <AppText variant="bodyStrong" color={active ? colors.primary : colors.text}>
                  {t(item.label)}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setUserCollapsed(!collapsed)}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? t('expandSidebar') : t('collapseSidebar')}
        style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.item,
          collapsed && styles.itemCollapsed,
          { backgroundColor: hovered ? colors.surfaceAlt : 'transparent' },
        ]}
      >
        <Ionicons name={collapsed ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.textMuted} />
        {!collapsed ? (
          <AppText variant="bodyStrong" muted>
            {t('collapse')}
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { borderRightWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.sm, paddingVertical: space.sm },
  brandCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  brandText: { flex: 1 },
  logo: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  items: { flex: 1, gap: space.xs },
  item: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  itemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
});
