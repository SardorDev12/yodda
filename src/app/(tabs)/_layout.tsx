import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Image, Platform, Text, useWindowDimensions, View } from 'react-native';

import { EdgeSwipeZones } from '@/components/EdgeSwipeZones';
import { useSettings } from '@/store/settings-context';
import { radius, spacing } from '@/theme';

const SIDEBAR_BREAKPOINT = 720;
const SIDEBAR_HEADER_HEIGHT = 64;

export default function TabsLayout() {
  const { colors, t } = useSettings();
  const { width } = useWindowDimensions();
  const isSidebar = Platform.OS === 'web' && width >= SIDEBAR_BREAKPOINT;
  const activeColor = isSidebar ? colors.bg : colors.primary;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        // React Navigation snapshots screenOptions into per-route descriptors
        // at mount; the sidebar/bottom switch needs a hard remount (not just
        // a re-render) for colors to pick up the new isSidebar value.
        key={isSidebar ? 'sidebar' : 'bottom'}
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
          tabBarLabel: ({ focused, children }) => (
            <Text style={{ color: focused ? activeColor : colors.muted, fontSize: 13, fontWeight: '600' }}>
              {children}
            </Text>
          ),
          tabBarPosition: isSidebar ? 'left' : 'bottom',
          tabBarStyle: isSidebar
            ? {
                backgroundColor: colors.card,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                paddingTop: SIDEBAR_HEADER_HEIGHT,
              }
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
                    paddingHorizontal: spacing(2),
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Image
                    source={require('../../../assets/icon.png')}
                    style={{ width: 28, height: 28, borderRadius: radius.sm }}
                  />
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Yodda</Text>
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
