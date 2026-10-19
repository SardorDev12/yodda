import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

import { EdgeSwipeZones } from '@/components/EdgeSwipeZones';
import { useSettings } from '@/store/settings-context';

export default function TabsLayout() {
  const { colors, t } = useSettings();

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabel: ({ focused, children }) => (
            <Text style={{ color: focused ? colors.primary : colors.muted, fontSize: 13, fontWeight: '600' }}>
              {children}
            </Text>
          ),
          // The web nav lives in WebSidebar (rendered once at the root
          // layout, visible on every route) — the tab bar here would just
          // duplicate it, so it's hidden rather than rendered redundantly.
          tabBarStyle: Platform.OS === 'web' ? { display: 'none' } : { backgroundColor: colors.card, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="home" color={focused ? colors.primary : colors.muted} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: t('tabs.library'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="library" color={focused ? colors.primary : colors.muted} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name="settings" color={focused ? colors.primary : colors.muted} size={size} />
            ),
          }}
        />
      </Tabs>
      <EdgeSwipeZones />
    </>
  );
}
