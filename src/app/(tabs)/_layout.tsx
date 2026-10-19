import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { EdgeSwipeZones } from '@/components/EdgeSwipeZones';
import { useSettings } from '@/store/settings-context';
import { radius, spacing } from '@/theme';

const SIDEBAR_HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH_EXPANDED = 232;
const SIDEBAR_WIDTH_COLLAPSED = 76;
const SIDEBAR_TRANSITION = 'width 200ms ease';

export default function TabsLayout() {
  const { colors, t } = useSettings();
  const router = useRouter();
  const isSidebar = Platform.OS === 'web';
  const [collapsed, setCollapsed] = useState(false);
  const activeColor = isSidebar ? colors.bg : colors.primary;
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          // On the sidebar, the active item gets a solid primary-color pill
          // (the nav library's own default), so the label/icon need to
          // contrast against that pill rather than reuse colors.primary.
          tabBarActiveTintColor: activeColor,
          tabBarActiveBackgroundColor: isSidebar ? colors.primary : undefined,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabel: collapsed
            ? () => null
            : ({ focused, children }) => (
                <Text style={{ color: focused ? activeColor : colors.muted, fontSize: 13, fontWeight: '600' }}>
                  {children}
                </Text>
              ),
          tabBarItemStyle: isSidebar
            ? { justifyContent: collapsed ? 'center' : 'flex-start', paddingHorizontal: spacing(1.5) }
            : undefined,
          tabBarPosition: isSidebar ? 'left' : 'bottom',
          tabBarStyle: isSidebar
            ? ({
                backgroundColor: colors.card,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                paddingTop: SIDEBAR_HEADER_HEIGHT,
                width: sidebarWidth,
                // Web-only property — react-native-web passes it straight
                // through to the underlying DOM style; harmless no-op type
                // mismatch is why this object is cast below.
                transition: SIDEBAR_TRANSITION,
              } as ViewStyle)
            : { backgroundColor: colors.card, borderTopColor: colors.border },
          // Renders behind the tab items, absolutely filling the tab bar;
          // the matching paddingTop above reserves room for it so it reads
          // as a header rather than overlapping the first tab.
          tabBarBackground: isSidebar
            ? () => (
                <View
                  style={{
                    height: SIDEBAR_HEADER_HEIGHT,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing(1),
                    paddingHorizontal: spacing(1.5),
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Pressable
                    onPress={() => router.push('/')}
                    hitSlop={8}
                    accessibilityLabel={t('tabs.home')}
                  >
                    <Image
                      source={require('../../../assets/icon.png')}
                      style={{ width: 28, height: 28, borderRadius: radius.sm }}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    {!collapsed && <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Yodda</Text>}
                  </View>
                  <Pressable onPress={() => setCollapsed((v) => !v)} hitSlop={8}>
                    <Ionicons name="menu-outline" size={22} color={colors.muted} />
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="home" color={focused ? activeColor : colors.muted} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: t('tabs.library'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="library" color={focused ? activeColor : colors.muted} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="settings" color={focused ? activeColor : colors.muted} size={size} />
            ),
          }}
        />
      </Tabs>
      <EdgeSwipeZones />
    </View>
  );
}
