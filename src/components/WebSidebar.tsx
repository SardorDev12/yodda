import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TranslationKey } from '@/i18n';
import { useSettings } from '@/store/settings-context';
import { radius, spacing } from '@/theme';

const HEADER_HEIGHT = 64;
const WIDTH_EXPANDED = 232;
const WIDTH_COLLAPSED = 76;

const ITEMS: { href: '/' | '/library' | '/settings'; icon: keyof typeof Ionicons.glyphMap; labelKey: TranslationKey }[] = [
  { href: '/', icon: 'home', labelKey: 'tabs.home' },
  { href: '/library', icon: 'library', labelKey: 'tabs.library' },
  { href: '/settings', icon: 'settings', labelKey: 'tabs.settings' },
];

/**
 * Persistent web nav rail, rendered once at the root layout (not inside the
 * tabs navigator) so it stays visible across every route — including
 * book/subject detail, which live outside the (tabs) group. An earlier
 * version lived inside React Navigation's tabBarBackground slot, which
 * isn't meant to hold interactive content — taps on its toggle button were
 * silently swallowed. A plain component tree avoids that entirely.
 */
export function WebSidebar() {
  const { colors, t } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState(false);

  if (Platform.OS !== 'web') return null;

  const width = collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED;

  return (
    <View style={[styles.root, { width, backgroundColor: colors.card, borderRightColor: colors.border }]}>
      <View
        style={[
          styles.header,
          collapsed && styles.headerCollapsed,
          { borderBottomColor: colors.border, paddingTop: insets.top + spacing(1) },
        ]}
      >
        <Pressable onPress={() => router.push('/')} hitSlop={8} accessibilityLabel={t('tabs.home')}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
        </Pressable>
        {!collapsed && (
          <View style={styles.headerSpacer}>
            <Text style={[styles.title, { color: colors.text }]}>Yodda</Text>
          </View>
        )}
        <Pressable onPress={() => setCollapsed((v) => !v)} hitSlop={8} accessibilityLabel={t('common.toggleSidebar')}>
          <Ionicons name="menu-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.items}>
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              style={[styles.item, collapsed && styles.itemCollapsed, active && { backgroundColor: colors.primary }]}
            >
              <Ionicons name={item.icon} size={20} color={active ? colors.bg : colors.muted} />
              {!collapsed && (
                <Text style={[styles.itemText, { color: active ? colors.bg : colors.muted }]}>{t(item.labelKey)}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderRightWidth: 1 },
  header: {
    minHeight: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    borderBottomWidth: 1,
  },
  headerCollapsed: { flexDirection: 'column', paddingHorizontal: 0 },
  headerSpacer: { flex: 1 },
  logo: { width: 28, height: 28, borderRadius: radius.sm },
  title: { fontSize: 17, fontWeight: '700' },
  items: { padding: spacing(1), gap: spacing(0.5) },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingVertical: spacing(1.25),
    paddingHorizontal: spacing(1.5),
    borderRadius: radius.md,
  },
  itemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  itemText: { fontSize: 14, fontWeight: '600' },
});
